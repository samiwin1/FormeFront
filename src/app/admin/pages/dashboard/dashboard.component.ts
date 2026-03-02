import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import {
  Certification,
  EligibleLearner,
  FailedOralAttempt,
  OralSession,
  PassedOralWithoutCertificate,
  PendingOralEvaluation,
} from '../../../core/models/certification.models';
import { UserDirectoryService } from '../../../core/services/user-directory.service';
import { AssignmentService } from '../../../core/services/assignment.service';
import { CertificationDashboardStore } from '../../../core/state/certification-dashboard.store';
import { DashboardService } from '../../../core/services/dashboard.service';
import { FormationDirectoryService, FormationOption } from '../../../core/services/formation-directory.service';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, StatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly userDirectory = inject(UserDirectoryService);
  private readonly assignmentService = inject(AssignmentService);
  private readonly dashboardStore = inject(CertificationDashboardStore);
  private readonly dashboardService = inject(DashboardService);
  private readonly formationDirectory = inject(FormationDirectoryService);

  certifications: Certification[] = [];
  sessions: OralSession[] = [];
  eligibleLearners: EligibleLearner[] = [];
  pendingEvaluations: PendingOralEvaluation[] = [];
  passedWithoutCertificate: PassedOralWithoutCertificate[] = [];
  failedAfterTwoAttempts: FailedOralAttempt[] = [];
  formationId = 1;
  totalSessions = 0;
  totalCertifications = 0;
  plannedSessions = 0;
  totalLearnersAssigned = 0;
  issuedCertifications = 0;
  pendingReschedules = 0;
  error: string | null = null;
  userNames: Record<number, string> = {};
  formationOptions: FormationOption[] = [];
  selectedFormationId: number | 'ALL' = 'ALL';
  eligibleSearch = '';
  eligibleStatusFilter: 'ALL' | 'PASSED' = 'ALL';
  eligiblePage = 1;
  readonly eligiblePageSize = 6;

  constructor() {
    effect(() => {
      this.certifications = this.dashboardStore.certifications();
      this.sessions = this.dashboardStore.sessions();
      this.eligibleLearners = this.dashboardStore.eligibleLearners();
      this.pendingEvaluations = this.dashboardStore.pendingEvaluations();
      this.passedWithoutCertificate = this.dashboardStore.passedWithoutCertificate();
      this.failedAfterTwoAttempts = this.dashboardStore.failedAfterTwoAttempts();
      this.totalSessions = this.dashboardStore.totalSessions();
      this.plannedSessions = this.dashboardStore.plannedSessions();
      this.totalLearnersAssigned = this.dashboardStore.totalLearnersAssigned();
      this.issuedCertifications = this.dashboardStore.issuedCertifications();
      this.pendingReschedules = this.dashboardStore.pendingReschedules();
      this.totalCertifications = this.dashboardStore.totalCertifications();
      this.error = this.dashboardStore.error();
      this.eligiblePage = 1;
    });

    effect(() => {
      const eligible = this.dashboardStore.eligibleLearners();
      const pending = this.dashboardStore.pendingEvaluations();
      const passed = this.dashboardStore.passedWithoutCertificate();
      this.resolveUserNames([
        ...eligible.map((item) => item.learnerId),
        ...pending.map((item) => item.learnerId),
        ...pending.map((item) => item.evaluatorId),
        ...passed.map((item) => item.learnerId),
        ...this.dashboardStore.failedAfterTwoAttempts().map((item) => item.learnerId),
      ]);
    });
  }

  ngOnInit(): void {
    this.loadFormationOptions();
  }

  loadOverview(): void {
    this.error = null;

    if (this.selectedFormationId === 'ALL') {
      this.loadOverviewAllFormations();
      return;
    }

    this.formationId = Number(this.selectedFormationId);
    const safeFormationId = Number(this.formationId);
    this.formationId = Number.isFinite(safeFormationId) && safeFormationId > 0 ? safeFormationId : 1;
    this.loadAdminDirectoryNames();
    this.dashboardStore.loadAdminOverview(this.formationId);
  }

  issueCertificate(assignmentId: number): void {
    this.error = null;
    this.assignmentService.issueCertificate(assignmentId).subscribe({
      next: () => this.loadOverview(),
      error: (err: unknown) => {
        this.error = this.errorMessage(err, 'Failed to issue certificate');
      },
    });
  }

  get filteredEligibleLearners(): EligibleLearner[] {
    const q = this.eligibleSearch.trim().toLowerCase();
    return this.eligibleLearners.filter((l) => {
      const statusMatch = this.eligibleStatusFilter === 'ALL' || (this.eligibleStatusFilter === 'PASSED' && l.passed === true);
      const name = this.displayUserName(l.learnerId, l.learnerName).toLowerCase();
      const score = l.writtenScore == null ? '' : String(l.writtenScore);
      const textMatch = !q || name.includes(q) || score.includes(q) || String(l.formationId ?? '').includes(q);
      return statusMatch && textMatch;
    });
  }

  get eligibleTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredEligibleLearners.length / this.eligiblePageSize));
  }

  get pagedEligibleLearners(): EligibleLearner[] {
    const page = Math.min(this.eligiblePage, this.eligibleTotalPages);
    const start = (page - 1) * this.eligiblePageSize;
    return this.filteredEligibleLearners.slice(start, start + this.eligiblePageSize);
  }

  onEligibleSearchOrFilterChange(): void {
    this.eligiblePage = 1;
  }

  previousEligiblePage(): void {
    this.eligiblePage = Math.max(1, this.eligiblePage - 1);
  }

  nextEligiblePage(): void {
    this.eligiblePage = Math.min(this.eligibleTotalPages, this.eligiblePage + 1);
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return (err.error?.message as string) || err.message || fallback;
    }
    return fallback;
  }

  getInitials(name: string): string {
    if (!name || !name.trim()) return '--';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    }
    return name.slice(0, 2).toUpperCase();
  }

  displayUserName(userId: number, fallbackName?: string | null): string {
    const resolved = this.userNames[userId];
    if (resolved && !this.isFallbackLabel(resolved)) {
      return resolved;
    }

    if (fallbackName && !this.isFallbackLabel(fallbackName)) {
      return fallbackName;
    }

    return resolved || fallbackName || `User #${userId}`;
  }

  displayFormationName(formationId: number, fallbackTitle?: string | null): string {
    if (fallbackTitle && fallbackTitle.trim()) {
      return fallbackTitle.trim();
    }
    const option = this.formationOptions.find((item) => item.id === formationId);
    if (option?.title?.trim()) {
      return option.title.trim();
    }
    return `Formation #${formationId}`;
  }

  pendingCertificationTitle(item: PendingOralEvaluation): string {
    if (item.certificationTitle?.trim()) {
      return item.certificationTitle.trim();
    }

    const session = this.sessions.find((s) => s.id === item.oralSessionId);
    if (session?.certificationTitle?.trim()) {
      return session.certificationTitle.trim();
    }
    if (session?.certificationId) {
      return `Certification #${session.certificationId}`;
    }
    return '-';
  }

  failedCertificationTitle(item: FailedOralAttempt): string {
    const session = this.sessions.find((s) => s.id === item.oralSessionId);
    if (session?.certificationTitle?.trim()) {
      return session.certificationTitle.trim();
    }
    return item.certificationId ? `Certification #${item.certificationId}` : '-';
  }

  private resolveUserNames(userIds: number[]): void {
    this.userDirectory.getNames(userIds).subscribe((names) => {
      this.userNames = { ...this.userNames, ...names };
    });
  }

  private loadOverviewAllFormations(): void {
    this.loadAdminDirectoryNames();
    this.dashboardStore.loadAdminOverview(1);

    const configuredIds = Array.from(new Set(this.formationOptions.map((f) => f.id).filter((id) => Number.isFinite(id) && id > 0)));

    if (!configuredIds.length) {
      // Keep overview data loaded from backend when formation directory is unavailable.
      return;
    }

    const requests = configuredIds.map((id) => this.dashboardService.getEligibleLearnersForOral(id));

    forkJoin(requests)
      .pipe(
        map((groups) => groups.flat()),
        map((rows) => {
          const seen = new Set<string>();
          return rows.filter((row) => {
            const key = `${row.learnerId}-${row.formationId}`;
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });
        })
      )
      .subscribe({
        next: (rows) => {
          this.eligibleLearners = rows;
          this.eligiblePage = 1;
        },
        error: () => {
          this.error = 'Failed to load eligible learners for all formations.';
        },
      });
  }

  private loadAdminDirectoryNames(): void {
    this.userDirectory.getDirectoryEntries().subscribe((entries) => {
      const map: Record<number, string> = {};
      for (const entry of entries) {
        const id = Number(entry.userId);
        if (Number.isFinite(id) && id > 0 && entry.displayName?.trim()) {
          map[id] = entry.displayName.trim();
        }
      }
      if (Object.keys(map).length) {
        this.userNames = { ...map, ...this.userNames };
      }
    });
  }

  private isFallbackLabel(value: string): boolean {
    const text = value.trim();
    return (
      /^User\s*#\d+$/i.test(text) ||
      /^Learner\s*#\d+$/i.test(text) ||
      /^Evaluator\s*#\d+$/i.test(text)
    );
  }

  private loadFormationOptions(): void {
    this.formationDirectory.getFormationOptions().subscribe((formations) => {
      this.formationOptions = formations;
      this.loadOverview();
    });
  }
}
