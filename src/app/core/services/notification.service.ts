import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval, forkJoin, combineLatest, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { AuthService } from './auth.service';
import { MentorNotificationService, MentorNotification } from './mentor-notification.service';

export interface AppNotification {
  id: number;
  userId?: number;
  type: 'CERTIFICATE_ISSUED' | 'SESSION_ASSIGNED' | 'NEW_FORMATION_DEMAND' | 'FORMATION_FULFILLED' | string;
  title: string;
  message: string;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
  source?: 'cert' | 'mentor';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = `${environment.certificationApiUrl ?? ''}/me/notifications`;
  private pollSub?: Subscription;
  private isAdmin = false;

  private readonly mentorNotif = inject(MentorNotificationService);

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount   = signal<number>(0);

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  startPolling(isAdmin = false): void {
    this.isAdmin = isAdmin;
    this.stopPolling();
    if (!this.auth.getToken()) return;
    this.loadAll();

    const certCountUrl   = `${this.api}/unread-count`;
    const mentorCountUrl = isAdmin
      ? `${environment.mentorApiUrl}/mentor/admin/notifications/unread-count`
      : `${environment.mentorApiUrl}/mentor/me/notifications/unread-count`;

    this.pollSub = interval(30_000).pipe(
      switchMap(() => combineLatest([
        this.http.get<{ count: number }>(certCountUrl).pipe(catchError(() => of({ count: 0 }))),
        this.http.get<{ count: number }>(mentorCountUrl).pipe(catchError(() => of({ count: 0 })))
      ]))
    ).subscribe({
      next: ([cert, mentor]) => {
        const total = (cert.count ?? 0) + (mentor.count ?? 0);
        if (total > 0) this.loadAll();
        else this.syncCombinedCount();
      },
      error: () => {}
    });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  loadAll(): void {
    const mentorUrl = this.isAdmin
      ? `${environment.mentorApiUrl}/mentor/admin/notifications`
      : `${environment.mentorApiUrl}/mentor/me/notifications`;

    forkJoin({
      cert:   this.http.get<AppNotification[]>(this.api).pipe(catchError(() => of([] as AppNotification[]))),
      mentor: this.http.get<MentorNotification[]>(mentorUrl).pipe(catchError(() => of([] as MentorNotification[])))
    }).subscribe({
      next: ({ cert, mentor }) => {
        const certTagged   = (Array.isArray(cert)   ? cert   : []).map(n => ({ ...n, source: 'cert'   as const }));
        const mentorTagged = (Array.isArray(mentor) ? mentor : []).map((n: MentorNotification) => ({ ...n, source: 'mentor' as const }));
        this.mentorNotif.notifications.set(mentorTagged);
        this.notifications.set([...certTagged, ...mentorTagged].sort(byDate));
        this.syncCombinedCount();
      },
      error: () => {}
    });
  }

  markAllRead(): void {
    this.http.patch<void>(`${this.api}/mark-all-read`, {}).subscribe({
      next: () => {
        this.mentorNotif.markAllRead(this.isAdmin);
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.unreadCount.set(0);
      },
      error: () => {}
    });
  }

  markOneRead(id: number): void {
    const notif = this.notifications().find(n => n.id === id);
    if (notif?.source === 'mentor') {
      this.mentorNotif.markOneRead(id, this.isAdmin);
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
      this.syncCombinedCount();
      return;
    }
    this.http.patch<void>(`${this.api}/${id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
        this.syncCombinedCount();
      },
      error: () => {}
    });
  }

  private syncCombinedCount(): void {
    this.unreadCount.set(this.notifications().filter(n => !n.read).length);
  }
}

function byDate(a: AppNotification, b: AppNotification): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
