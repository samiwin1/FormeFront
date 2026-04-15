import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import { ApiErrorBody, MentorAdviceResponseDto, MentorAdviceStructured } from '../../models/mentor.models';
import { MentorFeedbackComponent } from '../../components/mentor-feedback/mentor-feedback.component';

@Component({
  selector: 'app-mentor-remediation',
  standalone: true,
  imports: [CommonModule, RouterLink, MentorFeedbackComponent],
  templateUrl: './mentor-remediation.component.html',
  styleUrl: './mentor-remediation.component.css',
})
export class MentorRemediationComponent implements OnInit {
  formationId: number | null = null;
  loading = false;
  error: string | null = null;
  result: MentorAdviceResponseDto | null = null;
  structured: MentorAdviceStructured | null = null;

  constructor(
    private route: ActivatedRoute,
    private mentorApi: MentorApiService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('formationId'));
    if (!isNaN(id) && id > 0) {
      this.formationId = id;
      this.load();
    } else {
      this.error = 'Invalid formation ID.';
    }
  }

  load(): void {
    if (!this.formationId) return;
    this.loading = true;
    this.error = null;
    this.result = null;
    this.structured = null;
    this.mentorApi.getRemediation(this.formationId).subscribe({
      next: res => {
        this.result = res;
        this.structured = this.parseStructured(res.structuredJson);
        this.loading = false;
      },
      error: err => {
        const b = err.error as ApiErrorBody | undefined;
        this.error = b?.error ?? err.message ?? 'Could not generate remediation plan';
        this.loading = false;
      },
    });
  }

  private parseStructured(json: string | null | undefined): MentorAdviceStructured | null {
    if (!json) return null;
    try { return JSON.parse(json) as MentorAdviceStructured; } catch { return null; }
  }
}
