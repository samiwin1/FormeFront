import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { forkJoin, catchError, of } from 'rxjs';
import { FeedbackAnalyticsService } from '../services/feedback-analytics.service';
import { AuthService } from '../../core/services/auth.service';
import {
  FeedbackAnalyticsDashboardData,
  FeedbackAnalyticsFilters,
  FeedbackComment,
  FeedbackStatistics,
  FeedbackTrend,
  FormationFeedbackStats,
  MentorFeedbackStats,
  SentimentFilter,
} from '../models/feedback-analytics.models';

interface FeedbackAnalyticsState {
  statistics: FeedbackStatistics | null;
  trends: FeedbackTrend[];
  topMentors: MentorFeedbackStats[];
  bottomMentors: MentorFeedbackStats[];
  formationStats: FormationFeedbackStats[];
  recentComments: FeedbackComment[];
  loading: boolean;
  error: string | null;
  debugRequestUrl: string | null;
  debugStatus: number | null;
  debugMessage: string | null;
  filters: FeedbackAnalyticsFilters;
  lastUpdated: Date | null;
}

@Injectable({ providedIn: 'root' })
export class FeedbackAnalyticsStore {
  private feedbackService = inject(FeedbackAnalyticsService);
  private authService = inject(AuthService);

  // State
  private state = signal<FeedbackAnalyticsState>({
    statistics: null,
    trends: [],
    topMentors: [],
    bottomMentors: [],
    formationStats: [],
    recentComments: [],
    loading: false,
    error: null,
    debugRequestUrl: null,
    debugStatus: null,
    debugMessage: null,
    filters: {
      sentiment: 'ALL',
      timeRange: '30',
      formationIds: [],
      mentorIds: [],
    },
    lastUpdated: null,
  });

  // Public signals
  statistics = computed(() => this.state().statistics);
  trends = computed(() => this.state().trends);
  topMentors = computed(() => this.state().topMentors);
  bottomMentors = computed(() => this.state().bottomMentors);
  formationStats = computed(() => this.state().formationStats);
  recentComments = computed(() => this.state().recentComments);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  debugRequestUrl = computed(() => this.state().debugRequestUrl);
  debugStatus = computed(() => this.state().debugStatus);
  debugMessage = computed(() => this.state().debugMessage);
  filters = computed(() => this.state().filters);
  lastUpdated = computed(() => this.state().lastUpdated);

  // Computed signal for satisfied percentage
  satisfactionRate = computed(() => {
    const stats = this.statistics();
    return stats?.satisfactionRate ?? 0;
  });

  // Computed signal for total feedback count
  totalFeedback = computed(() => {
    const stats = this.statistics();
    return stats?.totalFeedback ?? 0;
  });

  constructor() {
    // Auto-reload when filters change
    effect(() => {
      const filters = this.filters();
      // Only trigger reload if filters actually changed (not on initial setup)
      if (this.state().statistics !== null) {
        this.loadDashboardData();
      }
    });
  }

  /**
   * Load all dashboard data with current filters
   */
  loadDashboardData(): void {
    this.state.update(s => ({
      ...s,
      loading: true,
      error: null,
      debugRequestUrl: null,
      debugStatus: null,
      debugMessage: null,
    }));

    const filters = this.filters();
    console.log('🔄 Loading feedback analytics with filters:', filters);

    this.feedbackService.getDashboardData(filters).subscribe({
      next: (data: FeedbackAnalyticsDashboardData) => {
        console.log('✅ Feedback analytics loaded successfully');
        this.state.update(s => ({
          ...s,
          statistics: data.statistics,
          trends: data.trends,
          topMentors: data.topMentors,
          bottomMentors: data.bottomMentors,
          formationStats: data.formationStats,
          recentComments: data.recentComments,
          loading: false,
          lastUpdated: new Date(),
        }));
      },
      error: (err: any) => {
        const message = this.buildErrorMessage(err);
        console.error('❌ Failed to load feedback analytics', {
          status: err?.status,
          statusText: err?.statusText,
          url: err?.url,
          backend: err?.error,
        });

        if (err?.status === 500 || err?.status === 403) {
          console.warn(
            '⚠️ Composite dashboard endpoint failed. Attempting fallback with individual analytics endpoints.'
          );
          this.loadDashboardSections(filters);
          this.state.update(s => ({
            ...s,
            error:
              err?.status === 403
                ? 'Partial analytics data loaded from fallback endpoints. The composite dashboard endpoint appears to be restricted to higher privileges.'
                : 'Partial analytics data loaded from fallback endpoints. The dashboard composite endpoint may be broken.',
            debugRequestUrl: err?.url ?? null,
            debugStatus: typeof err?.status === 'number' ? err.status : null,
            debugMessage: err?.error?.message || err?.message || null,
          }));
          return;
        }

        this.state.update(s => ({
          ...s,
          loading: false,
          error: message,
          debugRequestUrl: err?.url ?? null,
          debugStatus: typeof err?.status === 'number' ? err.status : null,
          debugMessage: err?.error?.message || err?.message || null,
        }));
      },
    });
  }

  private loadDashboardSections(filters: FeedbackAnalyticsFilters): void {
    forkJoin({
      statistics: this.feedbackService.getStatistics(filters).pipe(
        catchError((err) => {
          console.warn('Fallback statistics endpoint failed:', err);
          return of(null as FeedbackStatistics | null);
        })
      ),
      trends: this.feedbackService.getTrends(filters).pipe(
        catchError((err) => {
          console.warn('Fallback trends endpoint failed:', err);
          return of([] as FeedbackTrend[]);
        })
      ),
      mentorData: this.feedbackService.getMentorStats(filters).pipe(
        catchError((err) => {
          console.warn('Fallback mentor stats endpoint failed:', err);
          return of({ topMentors: [], bottomMentors: [] } as {
            topMentors: MentorFeedbackStats[];
            bottomMentors: MentorFeedbackStats[];
          });
        })
      ),
      formationStats: this.feedbackService.getFormationStats(filters).pipe(
        catchError((err) => {
          console.warn('Fallback formation stats endpoint failed:', err);
          return of([] as FormationFeedbackStats[]);
        })
      ),
      recentComments: this.feedbackService.getRecentComments(20, filters).pipe(
        catchError((err) => {
          console.warn('Fallback recent comments endpoint failed:', err);
          return of([] as FeedbackComment[]);
        })
      ),
    }).subscribe({
      next: ({ statistics, trends, mentorData, formationStats, recentComments }) => {
        this.state.update(s => ({
          ...s,
          statistics,
          trends,
          topMentors: mentorData.topMentors,
          bottomMentors: mentorData.bottomMentors,
          formationStats,
          recentComments,
          loading: false,
          error: null, // Clear error since we loaded some data
          lastUpdated: new Date(),
        }));
      },
      error: (err: any) => {
        const message = this.buildErrorMessage(err);
        console.error('❌ Fallback analytics loading failed', err);
        this.state.update(s => ({
          ...s,
          loading: false,
          error: message,
          debugRequestUrl: err?.url ?? null,
          debugStatus: typeof err?.status === 'number' ? err.status : null,
          debugMessage: err?.error?.message || err?.message || null,
        }));
      },
    });
  }

  /**
   * Build a friendly error message for UI display.
   */
  private buildErrorMessage(err: any): string {
    if (!err) {
      return 'Failed to load feedback analytics. Unknown error.';
    }

    const status = err.status;
    const bodyMessage = err?.error?.message || err?.error?.error || err?.message;

    if (status === 403) {
      if (this.authService.isSuperAdmin()) {
        return 'Access Denied (403): Even super admins cannot access this endpoint. Please verify backend authorization rules for mentor analytics.';
      }
      if (this.authService.isAdmin()) {
        return 'Access Denied (403): Your account is ROLE_ADMIN, but this analytics endpoint may require ROLE_SUPER_ADMIN or additional backend permissions.';
      }
      return 'Access Denied (403): Your account does not have permission to view mentor feedback analytics.';
    }
    if (status === 404) {
      return 'Not Found (404): Feedback analytics endpoint is not available. Backend route may be missing.';
    }
    if (status === 500) {
      return 'Server Error (500): Something went wrong on the backend. Check server logs.';
    }
    if (status === 0) {
      return 'Network Error: Cannot reach the backend. Ensure the API server is running.';
    }

    return bodyMessage ? `${status} ${bodyMessage}` : `Error ${status}: Failed to load feedback analytics.`;
  }

  /**
   * Refresh data with current filters (manual reload)
   */
  refresh(): void {
    this.loadDashboardData();
  }

  /**
   * Update filters and reload data
   */
  updateFilters(filters: Partial<FeedbackAnalyticsFilters>): void {
    this.state.update(s => ({
      ...s,
      filters: { ...s.filters, ...filters },
    }));
  }

  /**
   * Set date range and reload
   */
  setDateRange(dateFrom: string, dateTo: string): void {
    this.updateFilters({ dateFrom, dateTo });
  }

  /**
   * Set time range preset (7/30/90 days)
   */
  setTimeRange(range: '7' | '30' | '90'): void {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(range));

    this.updateFilters({
      timeRange: range,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    });
  }

  /**
   * Filter by formation
   */
  setFormations(formationIds: number[]): void {
    this.updateFilters({ formationIds });
  }

  /**
   * Filter by mentor
   */
  setMentors(mentorIds: number[]): void {
    this.updateFilters({ mentorIds });
  }

  /**
   * Filter by sentiment
   */
  setSentiment(sentiment: SentimentFilter): void {
    this.updateFilters({ sentiment });
  }

  /**
   * Reset all filters to defaults
   */
  resetFilters(): void {
    this.state.update(s => ({
      ...s,
      filters: {
        sentiment: 'ALL',
        timeRange: '30',
        formationIds: [],
        mentorIds: [],
      },
    }));
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.state.update(s => ({
      ...s,
      error: null,
      debugRequestUrl: null,
      debugStatus: null,
      debugMessage: null,
    }));
  }
}
