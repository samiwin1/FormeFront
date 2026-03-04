import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';

export interface AppNotification {
  id: number;
  userId: number;
  type: 'CERTIFICATE_ISSUED' | 'SESSION_ASSIGNED' | string;
  title: string;
  message: string;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = `${environment.certificationApiUrl}/me/notifications`;
  private pollSub?: Subscription;

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal<number>(0);

  constructor(private readonly http: HttpClient) {}

  startPolling(): void {
    this.stopPolling();
    this.loadAll();
    this.pollSub = interval(30_000)
      .pipe(switchMap(() => this.http.get<{ count: number }>(`${this.api}/unread-count`)))
      .subscribe({
        next: (res) => {
          this.unreadCount.set(res.count ?? 0);
          if ((res.count ?? 0) > 0) {
            this.loadAll();
          }
        },
        error: () => {}
      });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  loadAll(): void {
    this.http.get<AppNotification[]>(this.api).subscribe({
      next: (list) => {
        this.notifications.set(Array.isArray(list) ? list : []);
        this.unreadCount.set(this.notifications().filter((n) => !n.read).length);
      },
      error: (err) => { console.error('Notification load failed', err); }
    });
  }

  markAllRead(): void {
    this.http.patch<void>(`${this.api}/mark-all-read`, {}).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, read: true })));
        this.unreadCount.set(0);
      },
      error: (err) => { console.error('Notification mark-all-read failed', err); }
    });
  }

  markOneRead(id: number): void {
    this.http.patch<void>(`${this.api}/${id}/read`, {}).subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
        this.unreadCount.set(this.notifications().filter((n) => !n.read).length);
      },
      error: (err) => { console.error('Notification mark-one-read failed', err); }
    });
  }
}
