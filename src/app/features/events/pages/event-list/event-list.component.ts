import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { EventService } from '../../services/event.service';
import { ForMeEvent } from '../../models/event.models';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FullCalendarModule],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css',
})
export class EventListComponent implements OnInit {
  events: ForMeEvent[] = [];
  loading = true;
  error: string | null = null;
  showCalendar = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
  };

  constructor(
    private readonly eventService: EventService,
    private readonly profile: UserProfileService,
    private readonly location: Location,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.profile.refreshMe().pipe(finalize(() => this.load())).subscribe();
  }

  goBack(): void {
    this.location.back();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.eventService.getCatalog().subscribe({
      next: (data) => {
        this.events = data ?? [];
        this.loading = false;
        this.updateCalendarEvents();
      },
      error: (err: unknown) => {
        // Gateway or proxy often returns 404 when the route is missing; show the same calm empty state as no rows.
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
            ? [ (body as { error?: unknown }).error, (body as { message?: unknown }).message ].find(
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

  updateCalendarEvents(): void {
    const calendarEvents = this.events.map((e) => {
      const phase = this.eventPhase(e);
      let bgColor = '#f1f5f9'; // default (ended)
      let textColor = '#475569';
      
      if (phase === 'upcoming') {
        bgColor = '#fffbeb'; // amber-50
        textColor = '#b45309'; // amber-700
      } else if (phase === 'submissions_open') {
        bgColor = '#ecfdf5'; // emerald-50
        textColor = '#047857'; // emerald-700
      }

      return {
        id: e.id ? e.id.toString() : '',
        title: e.title,
        start: e.startDate,
        end: e.deadline,
        backgroundColor: bgColor,
        borderColor: bgColor,
        textColor: textColor,
      };
    });
    this.calendarOptions.events = calendarEvents;
  }

  handleEventClick(arg: any): void {
    this.router.navigate(['/events', arg.event.id]);
  }

  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
    // When toggling to true, FullCalendar might need to resize correctly,
    // though the auto height usually handles it well.
    if (this.showCalendar) {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
    }
  }

  formatDate(value: string | undefined): string {
    if (!value) return '';
    return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  /** Lifecycle label for cards (not formation levels). */
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
        return 'Submissions open';
      case 'ended':
        return 'Closed';
    }
  }
}
