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

  kpi: PartnerKpi | null = null;
  leaderboard: LeaderboardRow[] = [];
  alerts: PerformanceAlert[] = [];

  kpiError = '';
  leaderboardError = '';
  alertsError = '';

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.loadKpi();
    this.loadLeaderboard();
    this.loadAlerts();
  }

  loadKpi(): void {
    this.loadingKpi = true;
    this.kpiError = '';

    this.performanceService.getPartnerKpis(this.partnerId).subscribe({
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

  loadLeaderboard(): void {
    this.loadingLeaderboard = true;
    this.leaderboardError = '';

    this.performanceService.getLeaderboard(this.period, this.metric, this.limit).subscribe({
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

  loadAlerts(): void {
    this.loadingAlerts = true;
    this.alertsError = '';

    this.performanceService.getAlerts(true).subscribe({
      next: (alerts) => {
        this.alerts = alerts;
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
        this.loadAlerts();
      },
      error: () => {
        this.resolvingAlertId = null;
      },
    });
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
