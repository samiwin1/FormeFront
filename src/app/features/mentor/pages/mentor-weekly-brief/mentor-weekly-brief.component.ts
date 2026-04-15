import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiErrorBody, MentorAdviceResponseDto, MentorAdviceStructured } from '../../models/mentor.models';
import { MentorFeedbackComponent } from '../../components/mentor-feedback/mentor-feedback.component';

@Component({
  selector: 'app-mentor-weekly-brief',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MentorFeedbackComponent],
  templateUrl: './mentor-weekly-brief.component.html',
  styleUrl: './mentor-weekly-brief.component.css',
})
export class MentorWeeklyBriefComponent implements OnInit {
  locale = '';
  loading = false;
  error = '';
  result: MentorAdviceResponseDto | null = null;
  structured: MentorAdviceStructured | null = null;
  lastFetchedAt: Date | null = null;

  private readonly toastService = inject(ToastService);

  constructor(private mentorApi: MentorApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.result = null;
    this.structured = null;
    this.error = '';
    this.loading = true;
    this.mentorApi.weeklyBrief(this.locale.trim() || undefined).subscribe({
      next: res => {
        this.result = res;
        this.structured = this.parseStructured(res.structuredJson);
        this.lastFetchedAt = new Date();
        this.error = '';
        this.loading = false;
      },
      error: err => {
        const details = err as { error?: ApiErrorBody | string; message?: string };
        const message =
          typeof details.error === 'string'
            ? details.error
            : details.error?.error ?? details.message ?? 'Could not load brief';
        this.error = message;
        this.toastService.error(message);
        this.loading = false;
      },
    });
  }

  private parseStructured(json: string | null | undefined): MentorAdviceStructured | null {
    if (!json) return null;
    try { return JSON.parse(json) as MentorAdviceStructured; } catch { return null; }
  }
}
