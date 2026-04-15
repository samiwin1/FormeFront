import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, of, tap, switchMap } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import {
  AnomalyAlert,
  ForecastSnapshot,
  PartnerInsightSummary,
  PartnerIntelligenceOverview,
  RecommendationItem
} from '../models/partner-intelligence.models';

@Injectable({ providedIn: 'root' })
export class PartnerIntelligenceService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.partnerIntelligenceApiUrl;

  private overviewCache = new Map<number, PartnerIntelligenceOverview>();
  private summaryCache = new BehaviorSubject<PartnerInsightSummary[] | null>(null);
  private anomalyCache = new BehaviorSubject<AnomalyAlert[] | null>(null);
  private recCache = new Map<number, RecommendationItem[]>();

  runInference(partnerId: number, forceRefresh = false): Observable<PartnerIntelligenceOverview> {
    if (!forceRefresh && this.overviewCache.has(partnerId)) {
      return of(this.overviewCache.get(partnerId)!);
    }
    return this.http.post<PartnerIntelligenceOverview>(`${this.api}/v1/partners/${partnerId}/run`, {}).pipe(
      tap(data => this.overviewCache.set(partnerId, data))
    );
  }

  getRecommendations(partnerId: number, forceRefresh = false): Observable<RecommendationItem[]> {
    if (!forceRefresh && this.recCache.has(partnerId)) {
      return of(this.recCache.get(partnerId)!);
    }
    return this.http.get<RecommendationItem[]>(`${this.api}/v1/partners/${partnerId}/recommendations`).pipe(
      tap(data => this.recCache.set(partnerId, data))
    );
  }

  getAnomalies(forceRefresh = false): Observable<AnomalyAlert[]> {
    if (!forceRefresh && this.anomalyCache.value) {
      return of(this.anomalyCache.value);
    }
    return this.http.get<AnomalyAlert[]>(`${this.api}/v1/anomalies`).pipe(
      tap(data => this.anomalyCache.next(data))
    );
  }

  getForecasts(): Observable<ForecastSnapshot[]> {
    return this.http.get<ForecastSnapshot[]>(`${this.api}/v1/forecast`);
  }

  getSummaries(forceRefresh = false): Observable<PartnerInsightSummary[]> {
    if (!forceRefresh && this.summaryCache.value) {
      return of(this.summaryCache.value);
    }
    return this.http.get<PartnerInsightSummary[]>(`${this.api}/v1/summaries`).pipe(
      tap(data => this.summaryCache.next(data))
    );
  }

  clearCaches() {
    this.overviewCache.clear();
    this.recCache.clear();
    this.summaryCache.next(null);
    this.anomalyCache.next(null);
  }

  decide(recommendationId: number, decision: 'APPROVED' | 'REJECTED', comment = ''): Observable<unknown> {
    return this.http.post(`${this.api}/v1/recommendations/${recommendationId}/decision`, {
      decision,
      comment,
      reviewer: 'admin'
    }).pipe(
      tap(() => this.recCache.clear()) // Invalidate recs cache on decision
    );
  }
}
