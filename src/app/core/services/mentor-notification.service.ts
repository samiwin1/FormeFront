import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';

export interface MentorNotification {
  id: number;
  type: 'NEW_FORMATION_DEMAND' | 'FORMATION_FULFILLED' | string;
  title: string;
  message: string;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
  source: 'mentor';
}

@Injectable({ providedIn: 'root' })
export class MentorNotificationService {
  private readonly adminApi = `${environment.mentorApiUrl}/mentor/admin/notifications`;
  private readonly userApi  = `${environment.mentorApiUrl}/mentor/me/notifications`;
  private pollSub?: Subscription;

  readonly notifications = signal<MentorNotification[]>([]);
  readonly unreadCount   = signal<number>(0);

  constructor(private readonly http: HttpClient) {}

  startPolling(isAdmin: boolean): void {
    this.stopPolling();
    this.loadAll(isAdmin);
    const countUrl = isAdmin
      ? `${this.adminApi}/unread-count`
      : `${this.userApi}/unread-count`;
    this.pollSub = interval(30_000)
      .pipe(switchMap(() => this.http.get<{ count: number }>(countUrl)))
      .subscribe({
        next: (res) => {
          this.unreadCount.set(res.count ?? 0);
          if ((res.count ?? 0) > 0) this.loadAll(isAdmin);
        },
        error: () => {}
      });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  loadAll(isAdmin: boolean): void {
    const url = isAdmin ? this.adminApi : this.userApi;
    this.http.get<MentorNotification[]>(url).subscribe({
      next: (list) => {
        const tagged = (Array.isArray(list) ? list : []).map(n => ({ ...n, source: 'mentor' as const }));
        this.notifications.set(tagged);
        this.unreadCount.set(tagged.filter(n => !n.read).length);
      },
      error: () => {}
    });
  }

  markAllRead(isAdmin: boolean): void {
    const url = isAdmin ? `${this.adminApi}/mark-all-read` : `${this.userApi}/mark-all-read`;
    this.http.patch<void>(url, {}).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.unreadCount.set(0);
      },
      error: () => {}
    });
  }

  markOneRead(id: number, isAdmin: boolean): void {
    const url = isAdmin ? `${this.adminApi}/${id}/read` : `${this.userApi}/${id}/read`;
    this.http.patch<void>(url, {}).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => n.id === id ? { ...n, read: true } : n));
        this.unreadCount.set(this.notifications().filter(n => !n.read).length);
      },
      error: () => {}
    });
  }
}
