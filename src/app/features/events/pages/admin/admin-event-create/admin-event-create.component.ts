import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { CreateEventPayload } from '../../../models/event.models';

@Component({
  selector: 'app-admin-event-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-event-create.component.html',
  styleUrl: './admin-event-create.component.css',
})
export class AdminEventCreateComponent {
  title = '';
  description = '';
  requirements = '';
  successMetrics = '';
  startLocal = '';
  deadlineLocal = '';
  maxVip = 2;
  maxGold = 4;
  maxSilver = 6;
  vipPrice = 0;
  goldPrice = 0;
  silverPrice = 0;
  loading = false;
  error: string | null = null;

  constructor(
    private readonly eventService: EventService,
    private readonly router: Router
  ) {
    const now = new Date();
    const start = new Date(now.getTime() + 86400000);
    const end = new Date(now.getTime() + 86400000 * 7);
    this.startLocal = this.toLocalInput(start);
    this.deadlineLocal = this.toLocalInput(end);
  }

  private toLocalInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  submit(): void {
    this.error = null;
    if (!this.title.trim()) {
      this.error = 'Title is required';
      return;
    }
    if (!this.startLocal || !this.deadlineLocal) {
      this.error = 'Start and deadline are required';
      return;
    }
    const start = new Date(this.startLocal);
    const end = new Date(this.deadlineLocal);
    if (end <= start) {
      this.error = 'Deadline must be after start';
      return;
    }
    const payload: CreateEventPayload = {
      title: this.title.trim(),
      description: this.description.trim(),
      requirements: this.requirements.trim(),
      successMetrics: this.successMetrics.trim(),
      startDate: start.toISOString(),
      deadline: end.toISOString(),
      maxVip: Math.max(0, this.maxVip | 0),
      maxGold: Math.max(0, this.maxGold | 0),
      maxSilver: Math.max(0, this.maxSilver | 0),
      vipPrice: Math.max(0, this.vipPrice | 0),
      goldPrice: Math.max(0, this.goldPrice | 0),
      silverPrice: Math.max(0, this.silverPrice | 0),
    };
    this.loading = true;
    this.eventService.create(payload).subscribe({
      next: (e) => {
        this.loading = false;
        this.router.navigate(['/admin/events']);
      },
      error: (err: unknown) => {
        this.loading = false;
        const he = err instanceof HttpErrorResponse ? err : null;
        const body = he?.error;
        const fromBody =
          typeof body === 'object' && body !== null
            ? [(body as { error?: unknown }).error, (body as { message?: unknown }).message].find(
                (x): x is string => typeof x === 'string'
              )
            : typeof body === 'string'
              ? body
              : undefined;
        const hint =
          he?.status === 404
            ? ' If the stack is healthy, verify Angular proxy `events-api` matches your gateway port (8086 vs 8082).'
            : '';
        this.error = (fromBody || he?.message || 'Create failed') + hint;
      },
    });
  }
}
