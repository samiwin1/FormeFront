import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiErrorBody, MentorHistoryItemDto } from '../../models/mentor.models';

@Component({
  selector: 'app-mentor-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mentor-history.component.html',
  styleUrl: './mentor-history.component.css',
})
export class MentorHistoryComponent implements OnInit {
  loading = true;
  rows: MentorHistoryItemDto[] = [];
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  private readonly toastService = inject(ToastService);

  constructor(private mentorApi: MentorApiService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.mentorApi.adviceHistory(this.page, this.size).subscribe({
      next: p => {
        this.rows = p.content ?? [];
        this.totalPages = p.totalPages ?? 0;
        this.totalElements = p.totalElements ?? 0;
        this.loading = false;
      },
      error: err => {
        const details = err as { error?: ApiErrorBody | string; message?: string };
        const message =
          typeof details.error === 'string'
            ? details.error
            : details.error?.error ?? details.message ?? 'Could not load history';
        this.toastService.error(message);
        this.loading = false;
      },
    });
  }

  prev(): void {
    if (this.page > 0) {
      this.page--;
      this.fetch();
    }
  }

  next(): void {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.fetch();
    }
  }

  channelBadgeClass(channel: string): string {
    switch (channel) {
      case 'ASK': return 'badge-info';
      case 'PRE_EXAM': return 'badge-warning';
      case 'REMEDIATION': return 'badge-danger';
      default: return 'badge-gray';
    }
  }

  channelIcon(channel: string): string {
    switch (channel) {
      case 'ASK': return 'bi-chat-quote';
      case 'PRE_EXAM': return 'bi-file-earmark-text';
      case 'REMEDIATION': return 'bi-arrow-repeat';
      default: return 'bi-question-circle';
    }
  }

  channelLabel(channel: string): string {
    switch (channel) {
      case 'ASK': return 'Question';
      case 'PRE_EXAM': return 'Pre-Exam';
      case 'REMEDIATION': return 'Remediation';
      default: return channel;
    }
  }

  bookmarking = new Set<number>();

  toggleBookmark(item: MentorHistoryItemDto, event: Event): void {
    event.stopPropagation();
    this.bookmarking.add(item.sessionId);
    this.mentorApi.toggleBookmark(item.sessionId).subscribe({
      next: res => {
        item.bookmarked = res.bookmarked;
        this.bookmarking.delete(item.sessionId);
        this.toastService.success(res.bookmarked ? 'Advice bookmarked' : 'Bookmark removed');
      },
      error: () => this.bookmarking.delete(item.sessionId),
    });
  }

  selectedHistory: MentorHistoryItemDto | null = null;
  selectedHistoryJson: object | null = null;

  openDetails(item: MentorHistoryItemDto): void {
    this.selectedHistory = item;
    this.selectedHistoryJson = this.parseJson(item.summary) ?? this.parseJson(item.structuredJsonPreview);
  }

  closeDetails(): void {
    this.selectedHistory = null;
    this.selectedHistoryJson = null;
  }

  parseJson(value?: string | null): object | null {
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  getPaginationEnd(): number {
    return Math.min((this.page + 1) * this.size, this.totalElements);
  }
}
