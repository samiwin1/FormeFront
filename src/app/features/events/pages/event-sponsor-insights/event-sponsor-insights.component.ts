import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EventService } from '../../services/event.service';
import { AdminParticipantRow, ForMeEvent, isEventTeaser } from '../../models/event.models';

type ChatTurn = { role: 'user' | 'assistant'; text: string };

@Component({
  selector: 'app-event-sponsor-insights',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './event-sponsor-insights.component.html',
  styleUrl: './event-sponsor-insights.component.css',
})
export class EventSponsorInsightsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly eventService = inject(EventService);

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
          const f = ev as ForMeEvent;
          this.eventTitle = f.title ?? '';
          if (!f.viewerIsSponsor) {
            this.error = 'Only event sponsors can open this page.';
            this.loading = false;
            this.rows = [];
            return;
          }
        } else {
          this.eventTitle = '';
          this.error = 'This view is not available for this event state.';
          this.loading = false;
          return;
        }
        this.eventService.sponsorListParticipants(this.eventId!).subscribe({
          next: (data) => {
            this.rows = data ?? [];
            this.loading = false;
            if (this.selected) {
              const still = this.rows.find((r) => r.participantId === this.selected!.participantId);
              this.select(still ?? null);
            }
          },
          error: (err: unknown) => {
            this.applyHttpError(err, 'Could not load participants.');
          },
        });
      },
      error: (err: unknown) => {
        this.eventTitle = '';
        this.applyHttpError(err, 'Event not found.');
      },
    });
  }

  private applyHttpError(err: unknown, fallback: string): void {
    const he = err instanceof HttpErrorResponse ? err : null;
    const body = he?.error;
    const fromBody =
      typeof body === 'object' && body !== null
        ? [(body as { error?: unknown }).error, (body as { message?: unknown }).message].find(
            (x): x is string => typeof x === 'string'
          )
        : undefined;
    this.error = fromBody || he?.message || fallback;
    this.loading = false;
  }

  select(row: AdminParticipantRow | null): void {
    this.selected = row;
    this.chatMessages = [];
    this.chatInput = '';
    this.chatError = null;
  }

  displayLabel(userId: number): string {
    return `User #${userId}`;
  }

  downloadZip(): void {
    if (this.eventId == null || this.selected?.depositId == null) return;
    this.eventService.downloadDepositZip(this.eventId, this.selected.depositId, 'viewer').subscribe({
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
    this.eventService.viewerReadmeChat(this.selected.depositId, msg).subscribe({
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
}
