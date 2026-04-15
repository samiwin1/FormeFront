import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { EventTeaserResponse, ForMeEvent, isEventTeaser } from '../../models/event.models';
import { bulletListFrom, formatEventDate } from '../../utils/event-display';

@Component({
  selector: 'app-event-participate',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-participate.component.html',
  styleUrl: './event-participate.component.css',
})
export class EventParticipateComponent implements OnInit {
  eventId!: number;
  event: ForMeEvent | EventTeaserResponse | null = null;
  loading = true;
  error: string | null = null;
  joinBusy = false;
  joinMsg: string | null = null;
  postJoinHint: string | null = null;

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
    this.joinMsg = null;
    this.postJoinHint = null;
    this.eventService.getOne(this.eventId).subscribe({
      next: (data) => {
        this.event = data;
        this.loading = false;
        const f = this.full;
        if (f?.viewerIsSponsor && !f.viewerHasJoined) {
          this.router.navigate(['/events', this.eventId, 'sponsor-insights']);
        }
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

  get full(): ForMeEvent | null {
    return this.event && !isEventTeaser(this.event) ? (this.event as ForMeEvent) : null;
  }

  get teaser(): EventTeaserResponse | null {
    return this.event && isEventTeaser(this.event) ? this.event : null;
  }

  eventStarted(e: ForMeEvent | EventTeaserResponse): boolean {
    return Date.now() >= new Date(e.startDate).getTime();
  }

  bulletListFrom = bulletListFrom;
  formatDate = formatEventDate;

  confirmParticipate(): void {
    this.joinMsg = null;
    this.postJoinHint = null;
    this.joinBusy = true;
    this.eventService.join(this.eventId).subscribe({
      next: () => {
        this.joinBusy = false;
        this.afterJoinSuccess();
      },
      error: (err) => {
        this.joinBusy = false;
        const body = err.error;
        const msg =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'object' && body?.message) ||
          '';
        if (typeof msg === 'string' && msg.toLowerCase().includes('already joined')) {
          this.afterJoinSuccess();
          return;
        }
        this.joinMsg = msg || 'Could not join';
      },
    });
  }

  private afterJoinSuccess(): void {
    const e = this.full ?? this.teaser;
    if (!e) return;
    if (this.eventStarted(e)) {
      this.router.navigate(['/events', this.eventId, 'workspace']);
      return;
    }
    this.joinMsg = 'You are registered for this event.';
    this.postJoinHint = `The participant workspace opens when the event starts (${this.formatDate(e.startDate)}). You can close this page and return then.`;
  }

  goWorkspace(): void {
    const e = this.full ?? this.teaser;
    if (e && this.eventStarted(e)) {
      this.router.navigate(['/events', this.eventId, 'workspace']);
    }
  }
}
