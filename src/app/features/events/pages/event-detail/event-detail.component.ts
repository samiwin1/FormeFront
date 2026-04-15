import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EventTeaserResponse, ForMeEvent, isEventTeaser } from '../../models/event.models';
import { bulletListFrom, formatEventDate } from '../../utils/event-display';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class EventDetailComponent implements OnInit {
  eventId!: number;
  event: ForMeEvent | EventTeaserResponse | null = null;
  loading = true;
  error: string | null = null;
  joinBusy = false;
  joinMsg: string | null = null;
  partnerBuyBusy: 'VIP' | 'GOLD' | 'SILVER' | null = null;
  partnerMsg: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    readonly router: Router,
    private readonly eventService: EventService,
    readonly auth: AuthService
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
    this.partnerMsg = null;
    this.eventService.getOne(this.eventId).subscribe({
      next: (data) => {
        this.event = data;
        this.loading = false;

        const partnerIntent = this.route.snapshot.queryParamMap.get('partner') === '1';
        if (partnerIntent && this.auth.getToken()) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { partner: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          this.scheduleScrollToSponsorSection();
        }

        this.tryAutoJoinFromQuery();
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

  private scheduleScrollToSponsorSection(): void {
    setTimeout(() => {
      document.getElementById('ev-sponsor-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  private tryAutoJoinFromQuery(): void {
    if (this.route.snapshot.queryParamMap.get('join') !== '1') return;
    this.auth.syncSessionState();
    if (!this.auth.getToken()) return;
    this.joinBusy = true;
    this.eventService.join(this.eventId).subscribe({
      next: () => {
        this.joinBusy = false;
        this.afterJoinRoute();
      },
      error: (err) => {
        this.joinBusy = false;
        const body = err.error;
        const msg =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'object' && body?.message) ||
          '';
        if (typeof msg === 'string' && msg.toLowerCase().includes('already joined')) {
          this.afterJoinRoute();
          return;
        }
        this.joinMsg = msg || 'Could not join';
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { join: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      },
    });
  }

  /** After registering: open workspace only once the event has started; otherwise stay on this page (waiting teaser). */
  private afterJoinRoute(): void {
    this.eventService.getOne(this.eventId).subscribe({
      next: (data) => {
        this.event = data;
        if (!isEventTeaser(data) && this.eventStarted(data as ForMeEvent)) {
          this.router.navigate(['/events', this.eventId, 'participate'], { replaceUrl: true });
        } else {
          this.router.navigate(['/events', this.eventId], { replaceUrl: true });
        }
      },
      error: () => this.router.navigate(['/events', this.eventId], { replaceUrl: true }),
    });
  }

  get full(): ForMeEvent | null {
    return this.event && !isEventTeaser(this.event) ? (this.event as ForMeEvent) : null;
  }

  get teaser(): EventTeaserResponse | null {
    return this.event && isEventTeaser(this.event) ? this.event : null;
  }

  eventStarted(e: ForMeEvent): boolean {
    return Date.now() >= new Date(e.startDate).getTime();
  }

  submissionOpen(e: ForMeEvent): boolean {
    const now = Date.now();
    return now >= new Date(e.startDate).getTime() && now <= new Date(e.deadline).getTime();
  }

  formatMoney(n: number | undefined): string {
    if (n == null || n <= 0) return '—';
    return `${n.toLocaleString()} TND`;
  }

  tierCanPurchase(
    price: number | undefined,
    max: number | undefined,
    current: number | undefined
  ): boolean {
    const m = max ?? 0;
    const c = current ?? 0;
    const p = price ?? 0;
    return p > 0 && m > 0 && c < m;
  }

  buyPartnerTier(tier: 'VIP' | 'GOLD' | 'SILVER'): void {
    this.auth.syncSessionState();
    if (!this.auth.getToken()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/events/${this.eventId}?partner=1` },
      });
      return;
    }
    this.partnerMsg = null;
    this.partnerBuyBusy = tier;
    this.eventService.buyPartnerTier(this.eventId, tier).subscribe({
      next: () => {
        this.partnerBuyBusy = null;
        this.load();
      },
      error: (err: unknown) => {
        this.partnerBuyBusy = null;
        const he = err instanceof HttpErrorResponse ? err : null;
        const body = he?.error;
        const m =
          typeof body === 'object' && body !== null && 'message' in body
            ? String((body as { message: unknown }).message)
            : typeof body === 'object' && body !== null && 'error' in body
              ? String((body as { error: unknown }).error)
              : he?.message;
        this.partnerMsg = m || 'Could not complete sponsorship.';
      },
    });
  }

  joinAsPartner(): void {
    this.joinMsg = null;
    this.partnerMsg = null;
    this.auth.syncSessionState();
    if (!this.auth.getToken()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/events/${this.eventId}?partner=1` },
      });
      return;
    }
    this.scheduleScrollToSponsorSection();
  }

  joinEvent(): void {
    this.joinMsg = null;
    this.auth.syncSessionState();
    if (!this.auth.getToken()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/events/${this.eventId}?join=1` },
      });
      return;
    }
    this.joinBusy = true;
    this.eventService.join(this.eventId).subscribe({
      next: () => {
        this.joinBusy = false;
        this.afterJoinRoute();
      },
      error: (err) => {
        this.joinBusy = false;
        const body = err.error;
        const msg =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'object' && body?.message) ||
          '';
        if (typeof msg === 'string' && msg.toLowerCase().includes('already joined')) {
          this.afterJoinRoute();
          return;
        }
        this.joinMsg = msg || 'Could not join';
      },
    });
  }

  goToBrief(): void {
    this.auth.syncSessionState();
    if (!this.auth.getToken()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/events/${this.eventId}/participate` },
      });
      return;
    }
    this.router.navigate(['/events', this.eventId, 'participate']);
  }

  bulletListFrom = bulletListFrom;
  formatDate = formatEventDate;

  descriptionPreview(text: string | undefined, max = 320): string {
    if (!text?.trim()) return '';
    const t = text.trim();
    if (t.length <= max) return t;
    return t.slice(0, max).trimEnd() + '…';
  }
}
