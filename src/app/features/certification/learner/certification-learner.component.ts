import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { futureDateValidator } from '../../../core/validators/date-validators';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Certification, IssuedCertification, OralAssignment, OralSession, PendingFeedbackDto, RescheduleResponse } from '../../../core/models/certification.models';
import { AssignmentService } from '../../../core/services/assignment.service';
import { CertificateEventsService } from '../../../core/services/certificate-events.service';
import { CertificationService } from '../../../core/services/certification.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OralSessionService } from '../../../core/services/oral-session.service';
import { ToastService } from '../../../core/services/toast.service';
import { SessionStatusPipe } from '../../../core/pipes/session-status.pipe';
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer/pdf-viewer.component';
import { FeedbackService } from '../../../core/services/feedback.service';
import { FeedbackModalComponent } from '../../../shared/components/feedback-modal/feedback-modal.component';

@Component({
  standalone: true,
  selector: 'app-certification-learner',
  imports: [CommonModule, ReactiveFormsModule, SessionStatusPipe, PdfViewerComponent, FeedbackModalComponent],
  templateUrl: './certification-learner.component.html',
  styleUrls: ['./certification-learner.component.css'],
})
export class CertificationLearnerComponent implements OnInit, OnDestroy {
  private readonly assignmentService = inject(AssignmentService);
  private readonly certificationService = inject(CertificationService);
  private readonly oralSessionService = inject(OralSessionService);
  private readonly dashboardService = inject(DashboardService);
  private readonly toast = inject(ToastService);
  private readonly certificateEvents = inject(CertificateEventsService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedbackService = inject(FeedbackService);

  availableCertifications: Certification[] = [];
  assignments: OralAssignment[] = [];
  mySessions: OralSession[] = [];
  certifications: IssuedCertification[] = [];
  myRescheduleRequests: RescheduleResponse[] = [];
  viewingCertId: number | null = null;
  writtenScore: number | null = null;
  loading = false;
  submittingReschedule = false;
  success: string | null = null;
  error: string | null = null;

  readonly pendingFeedback = signal<PendingFeedbackDto | null>(null);
  readonly showFeedbackModal = signal<boolean>(false);

  rescheduleForm = this.fb.group({
    assignmentId: [null as number | null, Validators.required],
    proposedDatetime: ['', [Validators.required, futureDateValidator()]],
    message: ['', Validators.required],
  });

  ngOnInit(): void {
    this.refresh();
    this.certificateEvents.connect();
    this.certificateEvents.certificateReady
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.toast.success('Your certificate is ready. You can download it below.');
        this.assignmentService.myIssuedCertifications().subscribe({
          next: (issued) => { this.certifications = issued; },
        });
      });
    interval(20000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.pollCertificates());

    this.feedbackService.checkPendingFeedback().subscribe({
      next: (pending) => {
        this.pendingFeedback.set(pending);
        if (pending.hasPending) {
          setTimeout(() => this.showFeedbackModal.set(true), 1500);
        }
      },
      error: () => {
        // silently ignore feedback errors on init
      }
    });
  }

  refresh(): void {
    this.loading = true;
    this.error = null;

    this.certificationService.list().subscribe({
      next: (certifications: Certification[]) => {
        this.availableCertifications = certifications.filter((c) => c.status === 'PUBLISHED');
        this.assignmentService.myAssignments().subscribe({
          next: (assignments: OralAssignment[]) => {
            this.assignments = assignments;
            this.oralSessionService.list().subscribe({
              next: (sessions: OralSession[]) => {
                const ids = new Set(assignments.map((a) => a.oralSessionId));
                this.mySessions = sessions.filter((s) => ids.has(s.id));
                this.assignmentService.myIssuedCertifications().subscribe({
                  next: (issued: IssuedCertification[]) => {
                    this.certifications = issued;
                    this.dashboardService.getMyRescheduleRequests().subscribe({
                      next: (reschedules: RescheduleResponse[]) => {
                        this.myRescheduleRequests = reschedules;
                      },
                      error: () => {
                        this.myRescheduleRequests = [];
                      },
                    });
                    this.dashboardService.getMyExamStatus().subscribe({
                      next: (status) => {
                        this.writtenScore = status.writtenScore;
                        this.loading = false;
                      },
                      error: () => {
                        this.writtenScore = null;
                        this.loading = false;
                      },
                    });
                  },
                  error: (err: unknown) => {
                    this.loading = false;
                    this.error = this.errorMessage(err, 'Failed to load certifications');
                  },
                });
              },
              error: (err: unknown) => {
                this.loading = false;
                this.error = this.errorMessage(err, 'Failed to load oral sessions');
              },
            });
          },
          error: (err: unknown) => {
            this.loading = false;
            this.error = this.errorMessage(err, 'Failed to load oral assignments');
          },
        });
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.errorMessage(err, 'Failed to load available certifications');
      },
    });
  }

  nextSession(): OralSession | null {
    const now = new Date().getTime();
    const upcoming = this.mySessions
      .filter((s) => new Date(s.scheduledAt).getTime() >= now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return upcoming.length ? upcoming[0] : null;
  }

  writtenScorePlaceholder(): string {
    return this.writtenScore == null ? '-' : String(this.writtenScore);
  }

  requestReschedule(): void {
    this.success = null;
    this.error = null;

    if (this.rescheduleForm.invalid) {
      this.rescheduleForm.markAllAsTouched();
      this.error = 'Please fill Assignment, future date/time, and reason.';
      return;
    }

    const assignmentId = Number(this.rescheduleForm.value.assignmentId);
    const proposedDatetimeRaw = String(this.rescheduleForm.value.proposedDatetime ?? '');
    const message = String(this.rescheduleForm.value.message ?? '').trim();

    if (!this.assignments.some((a) => a.id === assignmentId)) {
      this.error = 'Please select one of your own assignments.';
      return;
    }

    const proposedDatetime = this.toLocalDateTimeString(proposedDatetimeRaw);
    if (!proposedDatetime) {
      this.error = 'Invalid date/time format. Use the date picker.';
      return;
    }

    this.submittingReschedule = true;

    this.assignmentService
      .requestReschedule(assignmentId, {
        proposedDatetime,
        message,
      })
      .subscribe({
        next: () => {
          this.submittingReschedule = false;
          this.success = 'Reschedule request submitted';
          this.error = null;
          this.rescheduleForm.reset();
          this.refresh();
          this.dashboardService.getMyRescheduleRequests().subscribe({
            next: (reschedules: RescheduleResponse[]) => {
              this.myRescheduleRequests = reschedules;
            },
          });
        },
        error: (err: unknown) => {
          this.submittingReschedule = false;
          this.error = this.errorMessage(err, 'Failed to submit reschedule request');
          this.success = null;
        },
      });
  }

  viewPdf(certificateId: number): void {
    this.viewingCertId = certificateId;
  }

  downloadPdf(certificateId: number): void {
    this.assignmentService.downloadCertificatePdf(certificateId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `certificate-${certificateId}.pdf`;
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err: unknown) => {
        this.error = this.errorMessage(err, 'Failed to download PDF');
      },
    });
  }

  onFeedbackSubmitted(): void {
    this.showFeedbackModal.set(false);
    this.pendingFeedback.set(null);
  }

  onFeedbackDismissed(): void {
    this.showFeedbackModal.set(false);
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) || err.message || fallback;
    }
    return fallback;
  }

  ngOnDestroy(): void {
    this.certificateEvents.disconnect();
  }

  private pollCertificates(): void {
    this.assignmentService.myIssuedCertifications().subscribe({
      next: (issued) => {
        if (issued.length > this.certifications.length) {
          this.toast.success('Your certificate is ready. You can download it below.');
        }
        this.certifications = issued;
      },
      error: () => {},
    });
  }

  private toLocalDateTimeString(value: string): string | null {
    if (!value) {
      return null;
    }
    // datetime-local usually provides "yyyy-MM-ddTHH:mm", backend expects LocalDateTime.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return `${value}:00`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
      return value;
    }
    return null;
  }
}
