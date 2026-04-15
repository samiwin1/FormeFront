import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MentorApiService } from '../../services/mentor-api.service';
import { DifficultyAlert, PortfolioResponseDto, StreakResponseDto } from '../../models/mentor.models';
import { StreakBadgeComponent } from '../../components/streak-badge/streak-badge.component';

@Component({
  selector: 'app-mentor-hub',
  standalone: true,
  imports: [CommonModule, RouterLink, StreakBadgeComponent],
  templateUrl: './mentor-hub.component.html',
  styleUrl: './mentor-hub.component.css',
})
export class MentorHubComponent implements OnInit {
  portfolioMissing = false;
  loading = true;

  alerts: DifficultyAlert[] = [];
  dismissedAlertIds = new Set<number>();

  portfolio: PortfolioResponseDto | null = null;
  profileScore = 0;
  streak: StreakResponseDto | null = null;

  private readonly mentorApi = inject(MentorApiService);

  ngOnInit(): void {
    this.loadStreak();
    this.mentorApi.portfolioExists().subscribe({
      next: r => {
        this.portfolioMissing = !r.exists;
        this.loading = false;
        if (r.exists) {
          this.loadPortfolio();
          this.loadAlerts();
        }
      },
      error: () => {
        this.portfolioMissing = true;
        this.loading = false;
      },
    });
  }

  private loadPortfolio(): void {
    this.mentorApi.getPortfolio().subscribe({
      next: p => {
        this.portfolio = p;
        this.profileScore = this.computeScore(p);
      },
      error: () => {},
    });
  }

  private loadAlerts(): void {
    this.mentorApi.getDifficultyAlerts().subscribe({
      next: a => { this.alerts = a; },
      error: () => {},
    });
  }

  loadStreak(): void {
    this.mentorApi.getStreak().subscribe({
      next: s => { this.streak = s; },
      error: () => {},
    });
  }

  dismiss(alert: DifficultyAlert): void {
    this.dismissedAlertIds.add(alert.formationId);
  }

  get visibleAlerts(): DifficultyAlert[] {
    return this.alerts.filter(a => !this.dismissedAlertIds.has(a.formationId));
  }

  alertBorderClass(severity: string): string {
    switch (severity) {
      case 'HIGH':   return 'border-danger';
      case 'MEDIUM': return 'border-warning';
      default:       return 'border-info';
    }
  }

  alertIconClass(severity: string): string {
    switch (severity) {
      case 'HIGH':   return 'bi-exclamation-triangle-fill text-danger';
      case 'MEDIUM': return 'bi-exclamation-circle-fill text-warning';
      default:       return 'bi-info-circle-fill text-info';
    }
  }

  get profileBarClass(): string {
    if (this.profileScore >= 80) return 'bg-success';
    if (this.profileScore >= 50) return 'bg-warning';
    return 'bg-danger';
  }

  private computeScore(p: PortfolioResponseDto): number {
    let score = 0;
    if (p.currentRole?.trim())                                   score += 10;
    if (p.targetRole?.trim())                                    score += 10;
    if (p.bio?.trim())                                           score += 10;
    if (p.skills?.length > 0)                                    score += 10;
    if (p.weeklyStudyHours && p.weeklyStudyHours > 0)            score += 10;
    if (p.extendedPreferences?.primaryGoal)                      score += 10;
    if (p.extendedPreferences?.targetCertifications?.length)     score += 10;
    if (p.learningStyle)                                         score += 10;  // always set
    if (p.extendedPreferences?.studyWindows?.length)             score += 10;
    if (p.preferredLanguage?.trim())                             score += 10;
    return score;
  }
}
