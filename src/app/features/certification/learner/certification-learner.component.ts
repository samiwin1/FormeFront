import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { futureDateValidator } from '../../../core/validators/date-validators';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs/operators';
import { Certification, IssuedCertification, OralAssignment, OralSession, PendingFeedbackDto, RescheduleResponse } from '../../../core/models/certification.models';
import { AssignmentService } from '../../../core/services/assignment.service';
import { AuthService } from '../../../core/services/auth.service';
import { CertificateEventsService } from '../../../core/services/certificate-events.service';
import { CertificationService } from '../../../core/services/certification.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OralSessionService } from '../../../core/services/oral-session.service';
import { ToastService } from '../../../core/services/toast.service';
import { PdfViewerComponent } from '../../../shared/components/pdf-viewer/pdf-viewer.component';
import { FeedbackService } from '../../../core/services/feedback.service';
import { FeedbackModalComponent } from '../../../shared/components/feedback-modal/feedback-modal.component';
import { LinkedInPostCardComponent } from '../../../shared/components/linkedin-post-card/linkedin-post-card.component';

@Component({
  standalone: true,
  selector: 'app-certification-learner',
  imports: [CommonModule, ReactiveFormsModule, PdfViewerComponent, FeedbackModalComponent, LinkedInPostCardComponent],
  templateUrl: './certification-learner.component.html',
  styleUrls: ['./certification-learner.component.css'],
})
export class CertificationLearnerComponent implements OnInit, OnDestroy {
  private readonly assignmentService = inject(AssignmentService);
  private readonly authService = inject(AuthService);
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
  apiDiagnostics: string[] = [];

  // LinkedIn Modal
  showLinkedInModal = false;
  selectedCertId: number | null = null;
  selectedCertTitle: string | null = null;

  // PDF Modal
  showPdfModal = false;

  readonly pendingFeedback = signal<PendingFeedbackDto | null>(null);
  readonly showFeedbackModal = signal<boolean>(false);
  readonly manualFeedbackIssuedCertId = signal<number | null>(null);
  readonly manualFeedbackSessionId = signal<number | null>(null);

  rescheduleForm = this.fb.group({
    assignmentId: [null as number | null, Validators.required],
    proposedDatetime: ['', [Validators.required, futureDateValidator()]],
    message: ['', Validators.required],
  });

  ngOnInit(): void {
    this.refresh();
    
    // SSE connection for real-time certificate updates
    this.certificateEvents.connect();
    this.certificateEvents.certificateReady
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.toast.success('Your certificate is ready. You can download it below.');
        // Refresh only certificates when SSE event received
        this.assignmentService.myIssuedCertifications().subscribe({
          next: (issued) => { 
            this.certifications = issued; 
          },
          error: (err) => {
            console.error('Failed to refresh certificates after SSE event:', err);
          }
        });
      });

    // Check for pending feedback
    this.feedbackService.checkPendingFeedback()
      .pipe(catchError(() => of(null)))
      .subscribe((pending) => {
        if (pending) {
          this.pendingFeedback.set(pending);
          if (pending.hasPending) {
            setTimeout(() => this.showFeedbackModal.set(true), 1500);
          }
        }
      });
  }

  refresh(): void {
    this.loading = true;
    this.error = null;
    this.apiDiagnostics = [];

    // Load all data in parallel using forkJoin
    forkJoin({
      certifications: this.certificationService.list().pipe(
        catchError((err) => {
          this.trackApiError('certifications', err);
          return of([]);
        })
      ),
      assignments: this.assignmentService.myAssignments().pipe(
        catchError((err) => {
          this.trackApiError('my assignments', err);
          return of([]);
        })
      ),
      sessions: this.oralSessionService.list().pipe(
        catchError((err) => {
          this.trackApiError('oral sessions', err);
          return of([]);
        })
      ),
      issued: this.assignmentService.myIssuedCertifications().pipe(
        catchError((err) => {
          this.trackApiError('issued certifications', err);
          return of([]);
        })
      ),
      reschedules: this.dashboardService.getMyRescheduleRequests().pipe(
        catchError((err) => {
          this.trackApiError('my reschedule requests', err);
          return of([]);
        })
      ),
      examStatus: this.dashboardService.getMyExamStatus().pipe(
        catchError((err) => {
          this.trackApiError('my exam status', err);
          return of(null);
        })
      )
    }).subscribe({
      next: ({ certifications, assignments, sessions, issued, reschedules, examStatus }) => {
        this.availableCertifications = certifications.filter((c) => c.status === 'PUBLISHED');
        this.assignments = assignments;
        
        // Filter sessions to only those assigned to this learner
        const assignmentSessionIds = new Set(assignments.map((a) => a.oralSessionId));
        this.mySessions = sessions.filter((s) => assignmentSessionIds.has(s.id));
        
        this.certifications = issued;
        this.myRescheduleRequests = reschedules;
        this.writtenScore = examStatus?.writtenScore ?? null;
        if (this.apiDiagnostics.length > 0) {
          const details = this.apiDiagnostics.slice(0, 2).join(' | ');
          const user = this.authService.getEmail() ?? `uid:${this.authService.getUserId() ?? '-'}`;
          this.error = `API connected but some calls failed for ${user}: ${details}`;
        }
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.error = this.errorMessage(err, 'Failed to load data. Please try again.');
        this.toast.error(this.error);
      }
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
    this.manualFeedbackIssuedCertId.set(null);
    this.manualFeedbackSessionId.set(null);
  }

  onFeedbackDismissed(): void {
    this.showFeedbackModal.set(false);
    this.manualFeedbackIssuedCertId.set(null);
    this.manualFeedbackSessionId.set(null);
  }

  openFeedbackForCertification(issuedCertificationId: number): void {
    this.error = null;

    const cert = this.certifications.find((c) => c.id === issuedCertificationId);
    if (!cert) {
      this.error = 'Certificate not found.';
      return;
    }

    const openModal = (sessionId: number | null): void => {
      if (sessionId == null) {
        this.error = 'No oral session found for this certificate.';
        return;
      }
      this.manualFeedbackIssuedCertId.set(issuedCertificationId);
      this.manualFeedbackSessionId.set(sessionId);
      this.showFeedbackModal.set(true);
    };

    this.feedbackService.getFeedbackContext(issuedCertificationId)
      .pipe(catchError(() => of(null)))
      .subscribe((context) => {
        if (context?.alreadySubmitted) {
          this.error = 'Feedback already submitted for this certificate.';
          return;
        }

        if (context?.sessionId != null) {
          openModal(context.sessionId);
          return;
        }

        // Fallback to client-side mapping only if context endpoint fails or has no session.
        openModal(this.resolveSessionIdForCertificate(cert.certificationId));
      });
  }

  feedbackModalIssuedCertificationId(): number | null {
    return this.manualFeedbackIssuedCertId() ?? this.pendingFeedback()?.issuedCertificationId ?? null;
  }

  feedbackModalSessionId(): number | null {
    return this.manualFeedbackSessionId() ?? this.pendingFeedback()?.sessionId ?? null;
  }

  openLinkedInModal(certId: number, certTitle: string): void {
    this.selectedCertId = certId;
    this.selectedCertTitle = certTitle;
    this.showLinkedInModal = true;
    // Prevent body scroll when modal is open
    document.body.classList.add('modal-open');
  }

  closeLinkedInModal(): void {
    this.showLinkedInModal = false;
    this.selectedCertId = null;
    this.selectedCertTitle = null;
    // Re-enable body scroll
    document.body.classList.remove('modal-open');
  }

  openPdfModal(certificateId: number): void {
    this.viewingCertId = certificateId;
    this.showPdfModal = true;
    // Prevent body scroll when modal is open
    document.body.classList.add('modal-open');
  }

  closePdfModal(): void {
    this.showPdfModal = false;
    this.viewingCertId = null;
    // Re-enable body scroll
    document.body.classList.remove('modal-open');
  }


  private errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) || err.message || fallback;
    }
    return fallback;
  }

  private trackApiError(source: string, err: unknown): void {
    if (err instanceof HttpErrorResponse) {
      const status = err.status || 0;
      const msg = (typeof err.error === 'string' ? err.error : err.error?.message) || err.message || 'Request failed';
      this.apiDiagnostics.push(`${source}: [${status}] ${msg}`);
      return;
    }
    this.apiDiagnostics.push(`${source}: request failed`);
  }

  ngOnDestroy(): void {
    this.certificateEvents.disconnect();
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

  private resolveSessionIdForCertificate(certificationId: number): number | null {
    const candidateAssignments = this.assignments
      .filter((a) => {
        const session = this.mySessions.find((s) => s.id === a.oralSessionId);
        return session?.certificationId === certificationId;
      })
      .sort((a, b) => b.oralSessionId - a.oralSessionId);

    return candidateAssignments.length ? candidateAssignments[0].oralSessionId : null;
  }
}
