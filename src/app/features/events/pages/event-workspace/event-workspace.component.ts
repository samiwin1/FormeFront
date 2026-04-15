import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { DepositResponse, EventTeaserResponse, ForMeEvent, isEventTeaser } from '../../models/event.models';
import { bulletListFrom, formatEventDate } from '../../utils/event-display';
import { AgentThinkingAnimationComponent } from '../../../formation/components/agent-thinking-animation/agent-thinking-animation.component';

@Component({
  selector: 'app-event-workspace',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AgentThinkingAnimationComponent],
  templateUrl: './event-workspace.component.html',
  styleUrl: './event-workspace.component.css',
})
export class EventWorkspaceComponent implements OnInit {
  eventId!: number;
  event: ForMeEvent | EventTeaserResponse | null = null;
  loading = true;
  error: string | null = null;
  myDepositLoading = false;
  existingDeposit: DepositResponse | null = null;

  zipFile: File | null = null;
  readmeFile: File | null = null;
  depositBusy = false;
  depositMsg: string | null = null;
  dropActive = false;

  chatMessage = '';
  chatReply: string | null = null;
  chatBusy = false;
  chatError: string | null = null;

  readonly readmeHint =
    'Be very detailed in your README. File must be named README.md or README.txt.';

  constructor(
    private readonly route: ActivatedRoute,
    readonly router: Router,
    private readonly eventService: EventService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/events']);
      return;
    }
    this.eventId = id;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.eventService.getOne(this.eventId).subscribe({
      next: (data) => {
        this.event = data;
        this.loading = false;
        if (!this.ensureWorkspaceAllowed()) {
          return;
        }
        this.refreshMyDeposit();
      },
      error: (err) => {
        const body = err.error;
        this.error =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'object' && body?.message) ||
          'Event not found';
        this.loading = false;
      },
    });
  }

  private refreshMyDeposit(): void {
    this.myDepositLoading = true;
    this.existingDeposit = null;
    this.eventService.getMyDeposit(this.eventId).subscribe({
      next: (dep) => {
        this.existingDeposit = dep;
        this.myDepositLoading = false;
      },
      error: () => {
        this.myDepositLoading = false;
        this.existingDeposit = null;
      },
    });
  }

  /** @returns false if navigating away */
  private ensureWorkspaceAllowed(): boolean {
    const f = this.full;
    if (f?.viewerIsSponsor && !f.viewerHasJoined) {
      this.router.navigate(['/events', this.eventId, 'sponsor-insights']);
      return false;
    }
    if (this.teaser) {
      this.router.navigate(['/events', this.eventId, 'participate']);
      return false;
    }
    const e = this.full;
    if (e && Date.now() < new Date(e.startDate).getTime()) {
      this.router.navigate(['/events', this.eventId, 'participate']);
      return false;
    }
    return true;
  }

  get full(): ForMeEvent | null {
    return this.event && !isEventTeaser(this.event) ? (this.event as ForMeEvent) : null;
  }

  get teaser(): EventTeaserResponse | null {
    return this.event && isEventTeaser(this.event) ? this.event : null;
  }

  submissionOpen(e: ForMeEvent): boolean {
    const now = Date.now();
    return now >= new Date(e.startDate).getTime() && now <= new Date(e.deadline).getTime();
  }

  bulletListFrom = bulletListFrom;
  formatDate = formatEventDate;

  onZipPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.zipFile = input.files?.[0] ?? null;
    this.depositMsg = null;
  }

  onReadmePick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.readmeFile = input.files?.[0] ?? null;
    this.depositMsg = null;
  }

  private assignDroppedFiles(files: FileList | File[]): void {
    const list = Array.from(files);
    for (const f of list) {
      const n = f.name.toLowerCase();
      if (n.endsWith('.zip')) this.zipFile = f;
      if (n === 'readme.md' || n === 'readme.txt') this.readmeFile = f;
    }
    this.depositMsg = null;
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dropActive = false;
    if (ev.dataTransfer?.files?.length) {
      this.assignDroppedFiles(ev.dataTransfer.files);
    }
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.dropActive = true;
  }

  onDragLeave(): void {
    this.dropActive = false;
  }

  submitDeposit(): void {
    const e = this.full;
    if (!e || !this.submissionOpen(e) || this.existingDeposit) return;
    if (!this.zipFile || !this.readmeFile) {
      this.depositMsg = 'Drop or select both a .zip archive and README.md / README.txt.';
      return;
    }
    if (!this.zipFile.name.toLowerCase().endsWith('.zip')) {
      this.depositMsg = 'Project archive must be a .zip file.';
      return;
    }
    const rn = this.readmeFile.name.toLowerCase();
    if (rn !== 'readme.md' && rn !== 'readme.txt') {
      this.depositMsg = 'README must be named exactly README.md or README.txt.';
      return;
    }
    this.depositBusy = true;
    this.depositMsg = null;
    this.eventService.submitDeposit(this.eventId, this.zipFile, this.readmeFile).subscribe({
      next: (res) => {
        this.depositBusy = false;
        this.existingDeposit = res;
        this.zipFile = null;
        this.readmeFile = null;
        this.depositMsg = null;
      },
      error: (err) => {
        this.depositBusy = false;
        const body = err.error;
        this.depositMsg =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'object' && body?.message) ||
          'Upload failed';
      },
    });
  }

  sendChat(): void {
    const e = this.full;
    if (!e) return;
    const q = this.chatMessage?.trim();
    if (!q) return;
    this.chatBusy = true;
    this.chatError = null;
    this.eventService.participantChat(this.eventId, q).subscribe({
      next: (res) => {
        this.chatBusy = false;
        this.chatReply = res.reply;
      },
      error: (err) => {
        this.chatBusy = false;
        const body = err.error;
        this.chatError =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'object' && body?.message) ||
          'Assistant unavailable';
      },
    });
  }
}
