import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { ForMeEvent } from '../../../models/event.models';

@Component({
  selector: 'app-admin-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-event-list.component.html',
  styleUrl: './admin-event-list.component.css',
})
export class AdminEventListComponent implements OnInit {
  events: ForMeEvent[] = [];
  loading = true;
  error: string | null = null;

  constructor(private readonly eventService: EventService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.eventService.adminList().subscribe({
      next: (data) => {
        this.events = data ?? [];
        this.loading = false;
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.events = [];
          this.error = null;
          this.loading = false;
          return;
        }
        const he = err instanceof HttpErrorResponse ? err : null;
        const body = he?.error;
        const fromBody =
          typeof body === 'object' && body !== null
            ? [(body as { error?: unknown }).error, (body as { message?: unknown }).message].find(
                (x): x is string => typeof x === 'string'
              )
            : undefined;
        this.error =
          fromBody ||
          he?.message ||
          'Failed to load events. Ensure the API gateway and events-service are running.';
        this.loading = false;
      },
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    this.eventService.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.error = err.error?.error || err.error?.message || 'Delete failed';
      },
    });
  }

  formatDate(value: string | undefined): string {
    if (!value) return '';
    return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  eventPhase(e: ForMeEvent): 'upcoming' | 'submissions_open' | 'ended' {
    const now = Date.now();
    const start = new Date(e.startDate).getTime();
    const end = new Date(e.deadline).getTime();
    if (now < start) return 'upcoming';
    if (now <= end) return 'submissions_open';
    return 'ended';
  }

  phaseLabel(e: ForMeEvent): string {
    switch (this.eventPhase(e)) {
      case 'upcoming':
        return 'Upcoming';
      case 'submissions_open':
        return 'Open';
      case 'ended':
        return 'Closed';
    }
  }
}
