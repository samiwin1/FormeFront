import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvaluatorOverview, OralAssignment, OralSession } from '../../../core/models/certification.models';
import { AssignmentService } from '../../../core/services/assignment.service';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OralSessionService } from '../../../core/services/oral-session.service';
import { UserDirectoryService } from '../../../core/services/user-directory.service';

@Component({
  standalone: true,
  selector: 'app-certification-evaluator',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './certification-evaluator.component.html',
  styleUrls: ['./certification-evaluator.component.css'],
})
export class CertificationEvaluatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assignmentService = inject(AssignmentService);
  private readonly oralSessionService = inject(OralSessionService);
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly userDirectory = inject(UserDirectoryService);

  result: OralAssignment | null = null;
  assignedSessions: OralSession[] = [];
  evaluatorAssignments: OralAssignment[] = [];
  overview: EvaluatorOverview | null = null;
  todayAssignedCount = 0;
  success: string | null = null;
  error: string | null = null;
  userNames: Record<number, string> = {};

  form = this.fb.group({
    assignmentId: [null as number | null, Validators.required],
    oralScore: [null as number | null, [Validators.required, Validators.min(0), Validators.max(20)]],
    formationId: [null as number | null, Validators.required],
    evaluatorComment: [''],
  });

  ngOnInit(): void {
    this.loadEvaluatorOverview();
    this.loadAssignedSessions();
    this.loadEvaluatorQueue();
  }

  loadEvaluatorOverview(): void {
    this.dashboardService.getEvaluatorOverview().subscribe({
      next: (data) => {
        this.overview = data;
      },
      error: () => {
        this.overview = null;
      },
    });
  }

  loadAssignedSessions(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.assignedSessions = [];
      this.todayAssignedCount = 0;
      return;
    }

    this.oralSessionService.list().subscribe({
      next: (sessions: OralSession[]) => {
        this.assignedSessions = sessions.filter((s) => s.evaluatorId === userId);
        const today = new Date();
        this.todayAssignedCount = this.assignedSessions.filter((s) => {
          const d = new Date(s.scheduledAt);
          return d.getFullYear() === today.getFullYear()
            && d.getMonth() === today.getMonth()
            && d.getDate() === today.getDate();
        }).length;
      },
      error: (err: unknown) => {
        this.error = this.errorMessage(err);
      },
    });
  }

  get sessionsTodayCount(): number {
    return this.overview?.sessionsTodayCount ?? this.todayAssignedCount;
  }

  get learnersToEvaluateCount(): number {
    return this.overview?.learnersToEvaluateCount ?? this.evaluatorAssignments.length;
  }

  submitGrade(): void {
    this.error = null;
    this.success = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.assignmentService
      .grade(this.form.value.assignmentId!, {
        oralScore: this.form.value.oralScore!,
        formationId: this.form.value.formationId!,
        evaluatorComment: this.form.value.evaluatorComment || undefined,
      })
      .subscribe({
        next: (response: OralAssignment) => {
          this.result = response;
          this.success = 'Oral grade submitted successfully';
          this.loadAssignedSessions();
          this.loadEvaluatorQueue();
        },
        error: (err: unknown) => {
          this.error = this.errorMessage(err);
        },
      });
  }

  loadEvaluatorQueue(): void {
    this.assignmentService.evaluatorAssignments().subscribe({
      next: (assignments: OralAssignment[]) => {
        this.evaluatorAssignments = assignments;
        this.resolveUserNames(assignments.map((a) => a.learnerId));
      },
      error: () => {
        this.evaluatorAssignments = [];
      },
    });
  }

  displayUserName(userId: number): string {
    if (!Number.isFinite(userId) || userId <= 0) {
      return '-';
    }
    return this.userNames[userId] || `User #${userId}`;
  }

  sessionFor(assignment: OralAssignment): OralSession | undefined {
    return this.assignedSessions.find((s) => s.id === assignment.oralSessionId);
  }

  fillGradeFromQueue(assignment: OralAssignment): void {
    this.form.patchValue({
      assignmentId: assignment.id,
      formationId: assignment.formationId ?? null,
    });
  }

  canEvaluate(assignment: OralAssignment): boolean {
    return !['COMPLETED', 'NO_SHOW', 'FAILED'].includes(assignment.status);
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'FAILED':
        return 'status-failed';
      case 'COMPLETED':
        return 'status-completed';
      case 'NO_SHOW':
        return 'status-no-show';
      default:
        return 'status-open';
    }
  }

  markNoShow(assignment: OralAssignment): void {
    this.error = null;
    this.success = null;
    this.assignmentService.markNoShow(assignment.id).subscribe({
      next: () => {
        this.success = 'Learner marked as no-show';
        this.loadEvaluatorQueue();
      },
      error: (err: unknown) => {
        this.error = this.errorMessage(err);
      },
    });
  }

  private resolveUserNames(userIds: number[]): void {
    this.userDirectory.getNames(userIds).subscribe((names) => {
      this.userNames = { ...this.userNames, ...names };
    });
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) || err.message || 'Failed to submit grade';
    }
    return 'Failed to submit grade';
  }
}
