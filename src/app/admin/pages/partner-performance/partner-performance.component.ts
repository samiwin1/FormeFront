import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LeaderboardMetric,
  LeaderboardPeriod,
  LeaderboardRow,
  PartnerKpi,
  PerformanceAlert,
} from '../../../core/models/partner-performance.models';
import { PartnerPerformanceService } from '../../../core/services/partner-performance.service';

@Component({
  selector: 'app-partner-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './partner-performance.component.html',
  styleUrl: './partner-performance.component.css',
})
export class PartnerPerformanceComponent implements OnInit {
  private readonly performanceService = inject(PartnerPerformanceService);

  partnerId = 1;
  period: LeaderboardPeriod = '30d';
  metric: LeaderboardMetric = 'redemptionRate';
  limit = 10;

  loadingKpi = false;
  loadingLeaderboard = false;
  loadingAlerts = false;
  resolvingAlertId: number | null = null;
  alertSearch = '';
  alertSeverityFilter: PerformanceAlert['severity'] | 'ALL' = 'ALL';
  alertPage = 1;
  readonly alertPageSize = 5;

  kpi: PartnerKpi | null = null;
  leaderboard: LeaderboardRow[] = [];
  alerts: PerformanceAlert[] = [];

  kpiError = '';
  leaderboardError = '';
  alertsError = '';

  ngOnInit(): void {
    this.refreshAll(false);
  }

  refreshAll(force = true): void {
    this.loadKpi(force);
    this.loadLeaderboard(force);
    this.loadAlerts(force);
  }

  loadKpi(force = true): void {
    this.loadingKpi = true;
    this.kpiError = '';

    this.performanceService.getPartnerKpis(this.partnerId, undefined, undefined, force).subscribe({
      next: (kpi) => {
        this.kpi = kpi;
        this.loadingKpi = false;
      },
      error: () => {
        this.kpi = null;
        this.kpiError = 'Unable to load KPI snapshot.';
        this.loadingKpi = false;
      },
    });
  }

  loadLeaderboard(force = true): void {
    this.loadingLeaderboard = true;
    this.leaderboardError = '';

    this.performanceService.getLeaderboard(this.period, this.metric, this.limit, force).subscribe({
      next: (rows) => {
        this.leaderboard = rows;
        this.loadingLeaderboard = false;
      },
      error: () => {
        this.leaderboard = [];
        this.leaderboardError = 'Unable to load leaderboard.';
        this.loadingLeaderboard = false;
      },
    });
  }

  loadAlerts(force = true): void {
    this.loadingAlerts = true;
    this.alertsError = '';

    this.performanceService.getAlerts(true, force).subscribe({
      next: (alerts) => {
        this.alerts = alerts;
        this.alertPage = 1;
        this.loadingAlerts = false;
      },
      error: () => {
        this.alerts = [];
        this.alertsError = 'Unable to load open alerts.';
        this.loadingAlerts = false;
      },
    });
  }

  resolveAlert(alertId: number): void {
    this.resolvingAlertId = alertId;

    this.performanceService.resolveAlert(alertId).subscribe({
      next: () => {
        this.resolvingAlertId = null;
        this.loadAlerts(true);
      },
      error: () => {
        this.resolvingAlertId = null;
      },
    });
  }

  get filteredAlerts(): PerformanceAlert[] {
    const term = this.alertSearch.trim().toLowerCase();
    return this.alerts.filter((alert) => {
      const severityOk = this.alertSeverityFilter === 'ALL' || alert.severity === this.alertSeverityFilter;
      if (!severityOk) return false;
      if (!term) return true;
      const haystack = [alert.type, alert.message, String(alert.partnerId ?? ''), String(alert.dealId ?? '')]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }

  get alertTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAlerts.length / this.alertPageSize));
  }

  get paginatedAlerts(): PerformanceAlert[] {
    const safePage = Math.min(this.alertPage, this.alertTotalPages);
    const start = (safePage - 1) * this.alertPageSize;
    return this.filteredAlerts.slice(start, start + this.alertPageSize);
  }

  onAlertFiltersChanged(): void {
    this.alertPage = 1;
  }

  nextAlertPage(): void {
    this.alertPage = Math.min(this.alertTotalPages, this.alertPage + 1);
  }

  previousAlertPage(): void {
    this.alertPage = Math.max(1, this.alertPage - 1);
  }

  severityClass(severity: PerformanceAlert['severity']): string {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-danger-subtle text-danger';
      case 'HIGH':
        return 'bg-warning-subtle text-warning-emphasis';
      case 'MEDIUM':
        return 'bg-info-subtle text-info-emphasis';
      default:
        return 'bg-secondary-subtle text-secondary-emphasis';
    }
  }

  asPercent(value: number | undefined): string {
    if (value == null || Number.isNaN(value)) return '0.0%';
    return `${(value * 100).toFixed(1)}%`;
  }
}
