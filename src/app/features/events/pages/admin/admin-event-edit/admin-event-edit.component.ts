import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { CreateEventPayload, EventTeaserResponse, ForMeEvent, isEventTeaser } from '../../../models/event.models';

@Component({
  selector: 'app-admin-event-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-event-edit.component.html',
  styleUrl: './admin-event-edit.component.css',
})
export class AdminEventEditComponent implements OnInit {
  eventId!: number;
  title = '';
  description = '';
  requirements = '';
  successMetrics = '';
  startLocal = '';
  deadlineLocal = '';
  maxVip = 0;
  maxGold = 0;
  maxSilver = 0;
  vipPrice = 0;
  goldPrice = 0;
  silverPrice = 0;
  loading = false;
  loadError: string | null = null;
  error: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/admin/events']);
      return;
    }
    this.eventId = id;
    this.load();
  }

  private toLocalInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  load(): void {
    this.loadError = null;
    this.eventService.getOne(this.eventId).subscribe({
      next: (data) => {
        if (isEventTeaser(data as ForMeEvent | EventTeaserResponse)) {
          this.loadError = 'This event is not visible as full detail yet (teaser only).';
          return;
        }
        const e = data as ForMeEvent;
        this.title = e.title ?? '';
        this.description = e.description ?? '';
        this.requirements = e.requirements ?? '';
        this.successMetrics = e.successMetrics ?? '';
        this.startLocal = e.startDate ? this.toLocalInput(e.startDate) : '';
        this.deadlineLocal = e.deadline ? this.toLocalInput(e.deadline) : '';
        this.maxVip = e.maxVip ?? 0;
        this.maxGold = e.maxGold ?? 0;
        this.maxSilver = e.maxSilver ?? 0;
        this.vipPrice = e.vipPrice ?? 0;
        this.goldPrice = e.goldPrice ?? 0;
        this.silverPrice = e.silverPrice ?? 0;
      },
      error: (err) => {
        this.loadError = err.error?.error || err.error?.message || 'Failed to load';
      },
    });
  }

  submit(): void {
    this.error = null;
    if (!this.title.trim()) {
      this.error = 'Title is required';
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
    this.eventService.update(this.eventId, payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/events']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || err.error?.message || 'Update failed';
      },
    });
  }
}
