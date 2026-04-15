import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
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
import { FeedbackService } from '../../../core/services/feedback.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessService, PartnerStats, PartnerWithStats } from '../../../core/services/business.service';
import { PartnerIntelligenceService } from '../../../core/services/partner-intelligence.service';

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
  private readonly feedbackService = inject(FeedbackService);
  private readonly toastService = inject(ToastService);
  private readonly businessService = inject(BusinessService);
  private readonly partnerIntelligenceService = inject(PartnerIntelligenceService);

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
  userNames: Record<number, string> = {};
  formationOptions: FormationOption[] = [];
  selectedFormationId: number | 'ALL' = 'ALL';
  eligibleSearch = '';
  eligibleStatusFilter: 'ALL' | 'PASSED' = 'ALL';
  eligiblePage = 1;
  readonly eligiblePageSize = 6;
  readonly evaluatorRatings = signal<Map<number, number>>(new Map());
  error: string | null = null;

  totalPartners = 0;
  totalDeals = 0;
  totalPacks = 0;
  totalCodes = 0;
  activeCodesCount = 0;
  expiredCodesCount = 0;
  usedCodesCount = 0;
  loadingBusiness = true;
  partners: PartnerWithStats[] = [];
  loadingPartners = true;
  aiHealthScore = 0;
  aiOpenAnomalies = 0;
  aiPendingRecommendations = 0;
  aiForecast30d = 0;

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

      const uniqueEvaluatorIds = Array.from(
        new Set(pending.map((item) => item.evaluatorId).filter((id) => !!id))
      );
      for (const evaluatorId of uniqueEvaluatorIds) {
        if (this.evaluatorRatings().has(evaluatorId)) continue;
        this.feedbackService.getEvaluatorAvgRating(evaluatorId).subscribe({
          next: (res) => {
            this.evaluatorRatings.update((map) => {
              const next = new Map(map);
              next.set(evaluatorId, res.avgRating ?? 0);
              return next;
            });
          },
          error: () => {
            this.evaluatorRatings.update((map) => {
              const next = new Map(map);
              if (!next.has(evaluatorId)) {
                next.set(evaluatorId, 0);
              }
              return next;
            });
          },
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadFormationOptions();
    this.loadBusinessOverview();
    this.loadPartnerStats();
    this.loadAiOverview();
  }

  private loadAiOverview(): void {
    this.partnerIntelligenceService.runInference(1).subscribe({
      next: (overview) => {
        this.aiHealthScore = overview.avgHealthScore;
        this.aiOpenAnomalies = overview.openAnomalies;
        this.aiPendingRecommendations = overview.pendingRecommendations;
        this.aiForecast30d = overview.forecast30d;
      }
    });
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
    this.assignmentService.issueCertificate(assignmentId).subscribe({
      next: () => {
        this.toastService.success('Certificate issued successfully!');
        this.loadOverview();
      },
      error: (err: unknown) => {
        this.toastService.error(this.errorMessage(err, 'Failed to issue certificate'));
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

  getActivityLevel(stats?: PartnerStats): 'high' | 'medium' | 'low' {
    if (!stats) return 'low';
    const total = stats.totalDeals + stats.usedCodes;
    if (total >= 10) return 'high';
    if (total >= 3) return 'medium';
    return 'low';
  }

  getActivityBadge(stats?: PartnerStats): string {
    const level = this.getActivityLevel(stats);
    return { high: 'bg-success', medium: 'bg-warning', low: 'bg-secondary' }[level];
  }

  getActivityLabel(stats?: PartnerStats): string {
    const level = this.getActivityLevel(stats);
    return { high: 'High', medium: 'Medium', low: 'Low' }[level];
  }

  private loadBusinessOverview(): void {
    this.loadingBusiness = true;
    forkJoin({
      partners: this.businessService.getPartners(),
      deals: this.businessService.getDeals(),
      packs: this.businessService.getPacks(),
      codes: this.businessService.getAccessCodes(),
    }).subscribe({
      next: ({ partners, deals, packs, codes }) => {
        this.totalPartners = partners.length;
        this.totalDeals = deals.length;
        this.totalPacks = packs.length;
        this.totalCodes = codes.length;

        const today = new Date();
        this.activeCodesCount = codes.filter(c => !c.used && new Date(c.expirationDate) >= today).length;
        this.expiredCodesCount = codes.filter(c => !c.used && new Date(c.expirationDate) < today).length;
        this.usedCodesCount = codes.filter(c => c.used).length;
        this.loadingBusiness = false;
      },
      error: () => {
        this.loadingBusiness = false;
      },
    });
  }

  private loadPartnerStats(): void {
    this.loadingPartners = true;
    this.businessService.getPartners().subscribe({
      next: (partners) => {
        this.partners = partners.map(p => ({ ...p, loadingStats: true }));
        this.loadingPartners = false;
        this.partners.forEach((partner, index) => {
          this.businessService.getPartnerStats(partner.id!).subscribe({
            next: (stats) => {
              this.partners[index] = { ...this.partners[index], stats, loadingStats: false };
            },
            error: () => {
              this.partners[index] = {
                ...this.partners[index],
                stats: { totalDeals: 0, usedCodes: 0 },
                loadingStats: false,
              };
            },
          });
        });
      },
      error: () => {
        this.loadingPartners = false;
      },
    });
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
