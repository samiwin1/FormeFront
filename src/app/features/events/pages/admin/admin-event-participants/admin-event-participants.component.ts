import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EventService } from '../../../services/event.service';
import { AdminParticipantRow, ForMeEvent, isEventTeaser } from '../../../models/event.models';
import { UserSummaryService } from '../../../../../core/services/user-summary.service';

type ChatTurn = { role: 'user' | 'assistant'; text: string };

@Component({
  selector: 'app-admin-event-participants',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-event-participants.component.html',
  styleUrl: './admin-event-participants.component.css',
})
export class AdminEventParticipantsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);
  private readonly userSummaryService = inject(UserSummaryService);

  eventId: number | null = null;
  eventTitle = '';
  rows: AdminParticipantRow[] = [];
  selected: AdminParticipantRow | null = null;
  loading = true;
  error: string | null = null;
  chatInput = '';
  chatMessages: ChatTurn[] = [];
  chatBusy = false;
  chatError: string | null = null;
  /** Draft mark 0–100 while editing (synced on select). */
  markDraft: number | null = null;
  markSaving = false;
  markError: string | null = null;
  /** Resolved via user-service (admin batch). */
  private readonly userSummaries = new Map<number, { firstName: string; lastName: string; email: string }>();

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam != null ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      this.error = 'Invalid event.';
      this.loading = false;
      return;
    }
    this.eventId = id;
    this.load();
  }

  load(): void {
    if (this.eventId == null) return;
    this.loading = true;
    this.error = null;
    this.eventService.getOne(this.eventId).subscribe({
      next: (ev: ForMeEvent | unknown) => {
        if (ev != null && typeof ev === 'object' && !isEventTeaser(ev as ForMeEvent)) {
          this.eventTitle = (ev as ForMeEvent).title ?? '';
        } else {
          this.eventTitle = '';
        }
      },
      error: () => {
        this.eventTitle = '';
      },
    });
    this.eventService.adminListParticipants(this.eventId).subscribe({
      next: (data) => {
        this.rows = data ?? [];
        const ids = this.rows.map((r) => r.userId);
        this.userSummaryService.summariesByIds(ids).subscribe({
          next: (list) => {
            this.userSummaries.clear();
            for (const u of list) {
              this.userSummaries.set(u.id, {
                firstName: u.firstName ?? '',
                lastName: u.lastName ?? '',
                email: u.email ?? '',
              });
            }
            this.loading = false;
            if (this.selected) {
              const still = this.rows.find((r) => r.participantId === this.selected!.participantId);
              this.select(still ?? null);
            }
          },
          error: () => {
            this.userSummaries.clear();
            this.loading = false;
            if (this.selected) {
              const still = this.rows.find((r) => r.participantId === this.selected!.participantId);
              this.select(still ?? null);
            }
          },
        });
      },
      error: (err: unknown) => {
        const he = err instanceof HttpErrorResponse ? err : null;
        const body = he?.error;
        const fromBody =
          typeof body === 'object' && body !== null
            ? [(body as { error?: unknown }).error, (body as { message?: unknown }).message].find(
                (x): x is string => typeof x === 'string'
              )
            : undefined;
        this.error = fromBody || he?.message || 'Could not load participants.';
        this.loading = false;
      },
    });
  }

  select(row: AdminParticipantRow | null): void {
    this.selected = row;
    this.chatMessages = [];
    this.chatInput = '';
    this.chatError = null;
    this.markError = null;
    this.markDraft = row?.score ?? null;
  }

  saveMark(): void {
    if (this.eventId == null || this.selected == null || this.markSaving) return;
    const raw = this.markDraft;
    if (raw === null || Number.isNaN(raw)) {
      this.markError = 'Enter a mark between 0 and 100.';
      return;
    }
    const score = Math.round(Number(raw));
    if (score < 0 || score > 100) {
      this.markError = 'Mark must be between 0 and 100.';
      return;
    }
    this.markSaving = true;
    this.markError = null;
    this.eventService.adminUpdateParticipantScore(this.eventId, this.selected.participantId, score).subscribe({
      next: (updated) => {
        this.markSaving = false;
        this.rows = this.rows.map((r) =>
          r.participantId === updated.participantId ? { ...r, ...updated } : r
        );
        if (this.selected?.participantId === updated.participantId) {
          this.selected = { ...this.selected, ...updated };
          this.markDraft = updated.score ?? null;
        }
      },
      error: (err: unknown) => {
        const he = err instanceof HttpErrorResponse ? err : null;
        const body = he?.error;
        const m =
          typeof body === 'object' && body !== null && 'message' in body
            ? String((body as { message: unknown }).message)
            : he?.message;
        this.markError = m || 'Could not save mark.';
        this.markSaving = false;
      },
    });
  }

  downloadZip(): void {
    if (this.eventId == null || this.selected?.depositId == null) return;
    this.eventService.downloadDepositZip(this.eventId, this.selected.depositId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          this.selected!.zipOriginalFilename?.replace(/[^\w.\-]/g, '_') ||
          `submission-${this.selected!.depositId}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.chatError = 'Download failed.';
      },
    });
  }

  sendChat(): void {
    const msg = this.chatInput.trim();
    if (!msg || this.selected?.depositId == null || this.chatBusy) return;
    this.chatInput = '';
    this.chatMessages = [...this.chatMessages, { role: 'user', text: msg }];
    this.chatBusy = true;
    this.chatError = null;
    this.eventService.adminReadmeChat(this.selected.depositId, msg).subscribe({
      next: (res) => {
        this.chatMessages = [...this.chatMessages, { role: 'assistant', text: res.reply ?? '' }];
        this.chatBusy = false;
      },
      error: (err: unknown) => {
        const he = err instanceof HttpErrorResponse ? err : null;
        const body = he?.error;
        const m =
          typeof body === 'object' && body !== null && 'message' in body
            ? String((body as { message: unknown }).message)
            : he?.message;
        this.chatError = m || 'AI request failed.';
        this.chatBusy = false;
      },
    });
  }

  formatWhen(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  displayName(userId: number): string {
    const u = this.userSummaries.get(userId);
    if (!u) return `User #${userId}`;
    const name = `${u.firstName} ${u.lastName}`.trim();
    return name || `User #${userId}`;
  }

  displayEmail(userId: number): string {
    return this.userSummaries.get(userId)?.email ?? '';
  }
}
