import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiErrorBody, MentorAdviceResponseDto, MentorAdviceStructured } from '../../models/mentor.models';
import { MentorFeedbackComponent } from '../../components/mentor-feedback/mentor-feedback.component';

@Component({
  selector: 'app-mentor-pre-exam',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MentorFeedbackComponent],
  templateUrl: './mentor-pre-exam.component.html',
  styleUrl: './mentor-pre-exam.component.css',
})
export class MentorPreExamComponent implements OnInit {
  formationId!: number;
  locale = '';
  loading = false;
  error: string | null = null;
  result: MentorAdviceResponseDto | null = null;
  structured: MentorAdviceStructured | null = null;

  private readonly toastService = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private mentorApi: MentorApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('formationId');
    this.formationId = id ? parseInt(id, 10) : NaN;
    if (!Number.isFinite(this.formationId) || this.formationId < 1) {
      this.error = 'Invalid formation id in URL.';
    } else {
      this.load();
    }
  }

  load(): void {
    if (!Number.isFinite(this.formationId) || this.formationId < 1) return;
    this.result = null;
    this.structured = null;
    this.loading = true;
    this.mentorApi.preExamTips(this.formationId, this.locale.trim() || undefined).subscribe({
      next: res => {
        this.result = res;
        this.structured = this.parseStructured(res.structuredJson);
        this.loading = false;
      },
      error: err => {
        const details = err as { error?: ApiErrorBody | string; message?: string };
        const message =
          typeof details.error === 'string'
            ? details.error
            : details.error?.error ?? details.message ?? 'Could not load tips';
        this.toastService.error(message);
        this.error = message;
        this.loading = false;
      },
    });
  }

  private parseStructured(json: string | null | undefined): MentorAdviceStructured | null {
    if (!json) return null;
    try { return JSON.parse(json) as MentorAdviceStructured; } catch { return null; }
  }
}
