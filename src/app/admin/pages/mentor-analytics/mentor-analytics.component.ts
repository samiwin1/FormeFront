import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChartComponent } from 'ngx-apexcharts';
import {
  MentorAdminService,
  UsageStats,
  FeedbackStats,
  DemandStat,
  TopStreak,
} from '../../services/mentor-admin.service';

@Component({
  selector: 'app-mentor-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartComponent],
  templateUrl: './mentor-analytics.component.html',
  styleUrl: './mentor-analytics.component.css',
})
export class MentorAnalyticsComponent implements OnInit {
  loading = true;
  error: string | null = null;
  usageMode: 'daily' | 'monthly' = 'daily';

  usage: UsageStats | null = null;
  feedback: FeedbackStats | null = null;
  demands: DemandStat[] = [];
  topStreaks: TopStreak[] = [];

  usageChartOptions: any = null;
  demandChartOptions: any = null;
  feedbackChartOptions: any = null;

  constructor(private mentorAdmin: MentorAdminService) {}

  ngOnInit(): void {
    forkJoin({
      usage: this.mentorAdmin.getUsageStats(),
      feedback: this.mentorAdmin.getFeedbackStats(),
      demands: this.mentorAdmin.getFormationDemandStats(),
      streaks: this.mentorAdmin.getTopStreaks(),
    }).subscribe({
      next: ({ usage, feedback, demands, streaks }) => {
        this.usage = usage;
        this.feedback = feedback;
        this.demands = demands;
        this.topStreaks = streaks;
        this.buildCharts();
        this.loading = false;
      },
      error: err => {
        this.error = err?.message ?? 'Failed to load analytics';
        this.loading = false;
      },
    });
  }

  setUsageMode(mode: 'daily' | 'monthly'): void {
    this.usageMode = mode;
    this.buildUsageChart();
  }

  totalSessions(): number {
    return (this.usage?.daily ?? []).reduce((s, d) => s + d.count, 0);
  }

  satisfactionRate(): number {
    if (!this.feedback) return 0;
    const total = this.feedback.up + this.feedback.down;
    return total === 0 ? 0 : Math.round((this.feedback.up / total) * 100);
  }

  private buildCharts(): void {
    this.buildUsageChart();

    this.demandChartOptions = {
      series: [{ name: 'Requests', data: this.demands.map(d => d.count) }],
      chart: { type: 'bar', height: 300, toolbar: { show: false } },
      xaxis: { categories: this.demands.map(d => d.role) },
      colors: ['#5fcf80'],
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f5f9' },
    };

    this.feedbackChartOptions = {
      series: [this.feedback?.up ?? 0, this.feedback?.down ?? 0],
      chart: { type: 'donut', height: 300 },
      labels: ['👍 Helpful', '👎 Not helpful'],
      colors: ['#10b981', '#ef4444'],
      legend: { position: 'bottom', fontSize: '13px' },
      dataLabels: { enabled: true, formatter: (val: number) => Math.round(val) + '%' },
      plotOptions: { pie: { donut: { size: '65%' } } },
      stroke: { width: 2, colors: ['#fff'] },
    };
  }

  private buildUsageChart(): void {
    const pts = this.usageMode === 'daily'
      ? (this.usage?.daily ?? []).map(d => ({ x: d.day, y: d.count }))
      : (this.usage?.monthly ?? []).map(m => ({ x: m.month, y: m.count }));
    this.usageChartOptions = {
      series: [{ name: 'Sessions', data: pts }],
      chart: { type: 'line', height: 300, toolbar: { show: false } },
      xaxis: { type: 'category', labels: { rotate: -30 } },
      stroke: { curve: 'smooth', width: 2 },
      colors: ['#5fcf80'],
      grid: { borderColor: '#f1f5f9' },
      markers: { size: 4 },
    };
  }
}
