import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import {
  FeedbackAnalyticsDashboardData,
  FeedbackAnalyticsFilters,
  FeedbackComment,
  FeedbackStatistics,
  FeedbackTrend,
  FormationFeedbackStats,
  MentorFeedbackStats,
} from '../models/feedback-analytics.models';

@Injectable({ providedIn: 'root' })
export class FeedbackAnalyticsService {
  private readonly baseUrls = [
    // Primary: mentor-service has the actual mentor_feedback data
    `${(environment as any).mentorApiUrl ?? environment.apiUrl}/mentor/admin/feedback`,
    // Fallbacks
    `${environment.certificationApiUrl ?? environment.apiUrl}/admin/mentor/feedback`,
    `${environment.gatewayApiUrl ?? environment.apiUrl}/admin/mentor/feedback`,
  ].filter((url, index, urls) => url && urls.indexOf(url) === index);
  private readonly http = inject(HttpClient);

  /**
   * Get overall feedback statistics
   */
  getStatistics(filters?: FeedbackAnalyticsFilters): Observable<FeedbackStatistics> {
    let params = this.buildParams(filters);
    return this.executeRequest<FeedbackStatistics>('/statistics', params);
  }

  /**
   * Get feedback trends over time
   */
  getTrends(filters?: FeedbackAnalyticsFilters): Observable<FeedbackTrend[]> {
    let params = this.buildParams(filters);
    return this.executeRequest<FeedbackTrend[]>('/trends', params);
  }

  /**
   * Get top and bottom performing mentors
   */
  getMentorStats(filters?: FeedbackAnalyticsFilters): Observable<{
    topMentors: MentorFeedbackStats[];
    bottomMentors: MentorFeedbackStats[];
  }> {
    let params = this.buildParams(filters);
    return this.executeRequest<{
      topMentors: MentorFeedbackStats[];
      bottomMentors: MentorFeedbackStats[];
    }>('/by-mentor', params);
  }

  /**
   * Get feedback statistics by formation
   */
  getFormationStats(filters?: FeedbackAnalyticsFilters): Observable<FormationFeedbackStats[]> {
    let params = this.buildParams(filters);
    return this.executeRequest<FormationFeedbackStats[]>('/by-formation', params);
  }

  /**
   * Get recent comments with sentiment
   */
  getRecentComments(
    limit: number = 20,
    filters?: FeedbackAnalyticsFilters
  ): Observable<FeedbackComment[]> {
    let params = this.buildParams(filters);
    params = params.set('limit', limit.toString());
    return this.executeRequest<FeedbackComment[]>('/comments', params);
  }

  /**
   * Get complete dashboard data in one call
   */
  getDashboardData(filters?: FeedbackAnalyticsFilters): Observable<FeedbackAnalyticsDashboardData> {
    let params = this.buildParams(filters);
    return this.executeRequest<FeedbackAnalyticsDashboardData>('/dashboard', params);
  }

  /**
   * Build HTTP params from filters
   */
  private buildParams(filters?: FeedbackAnalyticsFilters): HttpParams {
    let params = new HttpParams();

    if (!filters) return params;

    if (filters.dateFrom) {
      params = params.set('dateFrom', filters.dateFrom);
    }

    if (filters.dateTo) {
      params = params.set('dateTo', filters.dateTo);
    }

    if (filters.formationIds && filters.formationIds.length > 0) {
      params = params.set('formationIds', filters.formationIds.join(','));
    }

    if (filters.mentorIds && filters.mentorIds.length > 0) {
      params = params.set('mentorIds', filters.mentorIds.join(','));
    }

    if (filters.sentiment && filters.sentiment !== 'ALL') {
      params = params.set('sentiment', filters.sentiment);
    }

    if (filters.timeRange) {
      params = params.set('timeRange', filters.timeRange);
    }

    return params;
  }

  private executeRequest<T>(path: string, params: HttpParams): Observable<T> {
    const urls = this.baseUrls.map((base) => `${base}${path}`);
    return this.tryUrlsSequentially<T>(urls, params, path);
  }

  private tryUrlsSequentially<T>(urls: string[], params: HttpParams, path: string, attempt = 0, lastError: any = null): Observable<T> {
    if (attempt >= urls.length) {
      return throwError(
        () =>
          lastError ?? new Error(`All analytics hosts failed for ${path}. Tried: ${urls.join(', ')}`)
      );
    }

    const url = urls[attempt];
    return this.http.get<T>(url, { params }).pipe(
      catchError((err) => {
        const status = err?.status;
        const shouldRetry = [401, 403, 404, 500].includes(status);

        if (!shouldRetry) {
          return throwError(() => err);
        }

        // If the first attempt fails with a server error, retry the same URL without time filters.
        if (status === 500 && attempt === 0 && params.has('timeRange')) {
          const reducedParams = this.removeTimeFilters(params);
          console.warn(
            `Analytics request to ${url} failed with 500. Retrying same host without time filters.`,
            err
          );
          return this.http.get<T>(url, { params: reducedParams }).pipe(
            catchError((reducedErr) => {
              return this.tryUrlsSequentially<T>(urls, reducedParams, path, attempt + 1, reducedErr);
            })
          );
        }

        console.warn(`Analytics request to ${url} failed with status ${status}. Trying next host or path variant.`, err);
        return this.tryUrlsSequentially<T>(urls, params, path, attempt + 1, err);
      })
    );
  }

  private removeTimeFilters(params: HttpParams): HttpParams {
    let reduced = params;
    if (reduced.has('timeRange')) {
      reduced = reduced.delete('timeRange');
    }
    if (reduced.has('dateFrom')) {
      reduced = reduced.delete('dateFrom');
    }
    if (reduced.has('dateTo')) {
      reduced = reduced.delete('dateTo');
    }
    return reduced;
  }
}

