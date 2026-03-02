import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppNotification, NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dropdown">
      <a class="nxl-head-link me-3" (click)="togglePanel($event)" href="#" role="button">
        <i class="feather-bell"></i>
        @if (unreadCount() > 0) {
          <span class="badge bg-danger nxl-h-badge">{{ unreadCount() > 9 ? '9+' : unreadCount() }}</span>
        }
      </a>

      @if (panelOpen()) {
        <div class="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-notifications-menu show fm-notif-menu">
          <div class="d-flex justify-content-between align-items-center notifications-head">
            <h6 class="fw-bold text-dark mb-0">Notifications</h6>
            @if (unreadCount() > 0) {
              <a href="#" class="fs-11 text-success text-end ms-auto" (click)="markAllRead($event)">
                <i class="feather-check"></i>
                <span>Mark all read</span>
              </a>
            }
          </div>

          @if (unreadNotifications().length === 0) {
            <div class="text-center p-3 text-muted">No notifications yet.</div>
          } @else {
            @for (notif of unreadNotifications(); track notif.id) {
              <button type="button" class="notifications-item fm-notif-item fm-unread" (click)="onNotifClick(notif, $event)">
                <div class="me-3 fs-5">{{ notif.type === 'CERTIFICATE_ISSUED' ? '??' : '??' }}</div>
                <div class="notifications-desc">
                  <div class="font-body text-truncate-2-line">
                    <span class="fw-semibold text-dark">{{ notif.title }}</span>
                    <div class="text-muted mt-1">{{ notif.message }}</div>
                  </div>
                  <div class="notifications-date text-muted border-bottom border-bottom-dashed">
                    {{ notif.createdAt | date:'MMM d, h:mm a' }}
                  </div>
                </div>
              </button>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .fm-notif-menu {
      display: block;
      max-height: 420px;
      overflow-y: auto;
      min-width: 360px;
    }
    .fm-notif-item {
      cursor: pointer;
      border-left: 3px solid transparent;
      width: 100%;
      text-align: left;
      border-top: 0;
      border-right: 0;
      border-bottom: 1px solid #eef2f7;
      border-left-width: 3px;
      background: transparent;
    }
    .fm-notif-item.fm-unread {
      background: #f5f9ff;
      border-left-color: #3b82f6;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  readonly panelOpen = signal(false);
  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly unreadNotifications = computed(() => this.notifications().filter((n) => !n.read));

  ngOnInit(): void {
    this.notificationService.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  togglePanel(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const next = !this.panelOpen();
    this.panelOpen.set(next);
    if (next) {
      this.notificationService.loadAll();
    }
  }

  markAllRead(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationService.markAllRead();
  }

  onNotifClick(notification: AppNotification, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!notification.read) {
      this.notificationService.markOneRead(notification.id);
    }
    this.panelOpen.set(false);
    this.navigateFromNotification(notification);
  }

  private navigateFromNotification(notification: AppNotification): void {
    const inAdminArea = this.router.url.startsWith('/admin');

    if (notification.type === 'CERTIFICATE_ISSUED') {
      if (inAdminArea) {
        this.router.navigate(['/admin/issued-certificates']);
      } else {
        this.navigateAndScroll('/me/certification-space', 'my-certifications');
      }
      return;
    }

    if (notification.type === 'SESSION_ASSIGNED') {
      if (inAdminArea) {
        this.router.navigate(['/admin/oral-sessions']);
      } else {
        this.navigateAndScroll('/me/certification-space', 'my-oral-sessions');
      }
      return;
    }

    this.router.navigate(['/me/certification-space']);
  }

  private navigateAndScroll(path: string, fragmentId: string): void {
    if (this.router.url.startsWith(path)) {
      setTimeout(() => {
        document.getElementById(fragmentId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
      return;
    }

    this.router.navigate([path], { fragment: fragmentId }).then(() => {
      setTimeout(() => {
        document.getElementById(fragmentId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    });
  }
}
