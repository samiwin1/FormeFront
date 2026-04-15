import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  ApiErrorBody,
  MentorAdviceStructured,
  ThreadDetailDto,
  ThreadMessageDto,
  ThreadSummaryDto,
} from '../../models/mentor.models';
import { MentorFeedbackComponent } from '../../components/mentor-feedback/mentor-feedback.component';

@Component({
  selector: 'app-mentor-ask',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MentorFeedbackComponent],
  templateUrl: './mentor-ask.component.html',
  styleUrl: './mentor-ask.component.css',
})
export class MentorAskComponent implements OnInit {
  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  // Thread list panel
  threads: ThreadSummaryDto[] = [];
  threadSearch = '';
  loadingThreads = false;

  get filteredThreads(): ThreadSummaryDto[] {
    const q = this.threadSearch.trim().toLowerCase();
    if (!q) return this.threads;
    return this.threads.filter(t =>
      t.title?.toLowerCase().includes(q) || t.lastMessage?.toLowerCase().includes(q)
    );
  }

  // Active thread panel
  activeThread: ThreadDetailDto | null = null;
  loadingThread = false;

  // Chat input
  draft = '';
  locale = '';
  sending = false;
  sendError: string | null = null;

  // Structured data cache per message id
  structuredCache = new Map<number, MentorAdviceStructured | null>();

  // Mobile: show chat panel (vs thread list)
  showChat = false;

  private readonly toastService = inject(ToastService);

  constructor(private mentorApi: MentorApiService) {}

  ngOnInit(): void {
    this.loadThreads();
  }

  loadThreads(): void {
    this.loadingThreads = true;
    this.mentorApi.getThreads().subscribe({
      next: threads => {
        this.threads = threads;
        this.loadingThreads = false;
      },
      error: err => {
        const b = err.error as ApiErrorBody | undefined;
        this.toastService.error(b?.error ?? err.message ?? 'Could not load conversations');
        this.loadingThreads = false;
      },
    });
  }

  selectThread(summary: ThreadSummaryDto): void {
    this.loadingThread = true;
    this.showChat = true;
    this.mentorApi.getThread(summary.id).subscribe({
      next: thread => {
        this.activeThread = thread;
        this.cacheStructured(thread.messages);
        this.loadingThread = false;
        queueMicrotask(() => this.scrollToBottom());
      },
      error: () => {
        this.loadingThread = false;
      },
    });
  }

  newConversation(): void {
    this.mentorApi.createThread().subscribe({
      next: thread => {
        this.activeThread = thread;
        this.structuredCache.clear();
        this.showChat = true;
        this.loadThreads();
      },
      error: () => {},
    });
  }

  archiveThread(summary: ThreadSummaryDto | ThreadDetailDto, event: Event): void {
    event.stopPropagation();
    this.mentorApi.archiveThread(summary.id).subscribe({
      next: () => {
        this.threads = this.threads.filter(t => t.id !== summary.id);
        if (this.activeThread?.id === summary.id) {
          this.activeThread = null;
          this.showChat = false;
        }
      },
      error: () => {},
    });
  }

  threadUpdatedAt(thread: ThreadDetailDto): string {
    return thread.messages.length > 0 ? thread.messages[thread.messages.length - 1].createdAt : new Date().toISOString();
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.sending || !this.activeThread) return;
    this.sendError = null;
    this.draft = '';
    this.sending = true;

    // Optimistic user message
    const tempId = -Date.now();
    const userMsg: ThreadMessageDto = {
      id: tempId, role: 'USER', content: text, createdAt: new Date().toISOString()
    };
    this.activeThread = {
      ...this.activeThread,
      messages: [...this.activeThread.messages, userMsg],
    };
    queueMicrotask(() => this.scrollToBottom());

    this.mentorApi.ask({
      question: text,
      locale: this.locale.trim() || undefined,
      threadId: this.activeThread!.id,
    }).subscribe({
      next: res => {
        this.sending = false;
        const structured = parseStructuredJson(res.structuredJson);
        const displayContent =
          structured?.summary?.trim() || res.summary?.trim() || '—';
        const assistantMsg: ThreadMessageDto = {
          id: -(Date.now() + 1),
          role: 'ASSISTANT',
          content: displayContent,
          sessionId: res.sessionId,
          createdAt: new Date().toISOString(),
        };
        if (structured) {
          this.structuredCache.set(assistantMsg.id, structured);
        }
        // Update thread title if backend auto-titled it
        this.activeThread = {
          ...this.activeThread!,
          messages: [...this.activeThread!.messages, assistantMsg],
        };
        // Refresh thread list to pick up updated title/timestamp
        this.loadThreads();
        queueMicrotask(() => this.scrollToBottom());
      },
      error: err => {
        const details = err as { error?: ApiErrorBody | string; message?: string };
        const message =
          typeof details.error === 'string'
            ? details.error
            : details.error?.error ?? details.message ?? 'Request failed';
        this.sendError = message;
        this.toastService.error(message);
        // Roll back optimistic message
        this.activeThread = {
          ...this.activeThread!,
          messages: this.activeThread!.messages.filter(m => m.id !== tempId),
        };
        this.draft = text;
      },
    });
  }

  backToList(): void {
    this.showChat = false;
  }

  getStructured(msg: ThreadMessageDto): MentorAdviceStructured | null {
    if (this.structuredCache.has(msg.id)) {
      return this.structuredCache.get(msg.id) ?? null;
    }
    // For messages loaded from DB, parse from content if it looks like JSON
    return null;
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  formationLink(id: number): string { return `/formations/${id}`; }

  private cacheStructured(messages: ThreadMessageDto[]): void {
    messages.forEach(m => {
      if (m.role === 'ASSISTANT') {
        this.structuredCache.set(m.id, null); // mark as seen
      }
    });
  }

  private scrollToBottom(): void {
    this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }
}

function parseStructuredJson(raw: string | null | undefined): MentorAdviceStructured | null {
  if (!raw?.trim()) return null;
  let s = raw.trim();
  if (s.startsWith('```')) {
    const firstNl = s.indexOf('\n');
    const lastFence = s.lastIndexOf('```');
    if (firstNl > 0 && lastFence > firstNl) s = s.substring(firstNl + 1, lastFence).trim();
  }
  try { return JSON.parse(s) as MentorAdviceStructured; } catch { return null; }
}
