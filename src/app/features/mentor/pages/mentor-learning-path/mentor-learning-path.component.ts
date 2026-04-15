import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  ApiErrorBody,
  LearningPathFormation,
  MentorAdviceResponseDto,
  MentorAdviceStructured,
} from '../../models/mentor.models';

@Component({
  selector: 'app-mentor-learning-path',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink],
  templateUrl: './mentor-learning-path.component.html',
  styleUrl: './mentor-learning-path.component.css',
})
export class MentorLearningPathComponent implements OnInit {
  loading = false;
  noPortfolio = false;
  error: string | null = null;
  result: MentorAdviceResponseDto | null = null;
  structured: MentorAdviceStructured | null = null;

  private readonly toastService = inject(ToastService);

  constructor(private mentorApi: MentorApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(refresh = false): void {
    this.error = null;
    this.noPortfolio = false;
    this.loading = true;
    if (refresh) {
      this.result = null;
      this.structured = null;
    }
    this.mentorApi.getLearningPath(refresh).subscribe({
      next: res => {
        this.result = res;
        this.structured = this.parseStructured(res.structuredJson);
        this.loading = false;
      },
      error: err => {
        const details = err as { status?: number; error?: ApiErrorBody | string; message?: string };
        const msg =
          typeof details.error === 'string'
            ? details.error
            : details.error?.error ?? details.message ?? 'Could not load learning path';
        if (details.status === 400 && msg.toLowerCase().includes('portfolio')) {
          this.noPortfolio = true;
        } else {
          this.toastService.error(msg);
          this.error = msg;
        }
        this.loading = false;
      },
    });
  }

  private parseStructured(json: string | null | undefined): MentorAdviceStructured | null {
    if (!json) return null;
    try {
      return JSON.parse(json) as MentorAdviceStructured;
    } catch {
      return null;
    }
  }

  statusBadgeClass(status: LearningPathFormation['status']): string {
    switch (status) {
      case 'COMPLETED':   return 'bg-success';
      case 'IN_PROGRESS': return 'bg-primary';
      default:            return 'bg-secondary';
    }
  }

  statusChipClass(status: LearningPathFormation['status']): string {
    switch (status) {
      case 'COMPLETED':   return 'chip-completed';
      case 'IN_PROGRESS': return 'chip-progress';
      default:            return 'chip-default';
    }
  }

  timelineDotClass(status: LearningPathFormation['status']): string {
    switch (status) {
      case 'COMPLETED':   return 'dot-completed';
      case 'IN_PROGRESS': return 'dot-progress';
      default:            return 'dot-default';
    }
  }

  riskBadgeClass(risk: string): string {
    switch (risk) {
      case 'HIGH':   return 'bg-danger';
      case 'MEDIUM': return 'bg-warning text-dark';
      default:       return 'bg-success';
    }
  }

  riskChipClass(risk: string): string {
    switch (risk?.toUpperCase()) {
      case 'HIGH':   return 'risk-high';
      case 'MEDIUM': return 'risk-medium';
      default:       return 'risk-low';
    }
  }

  statusLabel(status: LearningPathFormation['status']): string {
    switch (status) {
      case 'COMPLETED':   return 'Completed';
      case 'IN_PROGRESS': return 'In progress';
      default:            return 'Not started';
    }
  }

  actionLabel(status: LearningPathFormation['status']): string {
    return status === 'IN_PROGRESS' ? 'Continue' : 'Start';
  }

  /** Returns a rough completion percentage for cert progress bar. */
  certProgress(c: { remainingFormations: number; onTrack: boolean }): number {
    // Simple heuristic: fewer remaining = more progress
    const total = (c.remainingFormations ?? 0) + 3; // assume ~3 already done
    const done = total - (c.remainingFormations ?? 0);
    return Math.min(100, Math.round((done / total) * 100));
  }

  /** Maps skill level string to a 0-100 progress value. */
  skillProgress(level: string): number {
    const map: Record<string, number> = {
      beginner: 10, novice: 20, elementary: 30, intermediate: 50,
      advanced: 70, proficient: 80, expert: 95, master: 100,
    };
    return map[level?.toLowerCase()] ?? 40;
  }
}
