import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import {
  DealPerformance,
  LeaderboardMetric,
  LeaderboardPeriod,
  LeaderboardRow,
  PartnerKpi,
  PerformanceAlert,
} from '../models/partner-performance.models';

@Injectable({ providedIn: 'root' })
export class PartnerPerformanceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.partnerPerformanceApiUrl}/v1`;

  private kpisCache = new Map<string, PartnerKpi>();
  private leaderboardCache = new Map<string, LeaderboardRow[]>();
  private alertsCache: PerformanceAlert[] | null = null;
  private dealsCache = new Map<number, DealPerformance>();

  getPartnerKpis(partnerId: number, startDate?: string, endDate?: string, forceRefresh = false): Observable<PartnerKpi> {
    const key = `${partnerId}_${startDate || ''}_${endDate || ''}`;
    if (!forceRefresh && this.kpisCache.has(key)) {
      return of(this.kpisCache.get(key)!);
    }
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PartnerKpi>(`${this.base}/partners/${partnerId}/kpis`, { params }).pipe(
      tap(data => this.kpisCache.set(key, data))
    );
  }

  getDealPerformance(dealId: number, forceRefresh = false): Observable<DealPerformance> {
    if (!forceRefresh && this.dealsCache.has(dealId)) {
      return of(this.dealsCache.get(dealId)!);
    }
    return this.http.get<DealPerformance>(`${this.base}/deals/${dealId}/performance`).pipe(
      tap(data => this.dealsCache.set(dealId, data))
    );
  }

  getLeaderboard(period: LeaderboardPeriod, metric: LeaderboardMetric, limit = 10, forceRefresh = false): Observable<LeaderboardRow[]> {
    const key = `${period}_${metric}_${limit}`;
    if (!forceRefresh && this.leaderboardCache.has(key)) {
      return of(this.leaderboardCache.get(key)!);
    }
    const params = new HttpParams()
      .set('period', period)
      .set('metric', metric)
      .set('limit', limit);

    return this.http.get<LeaderboardRow[]>(`${this.base}/leaderboard`, { params }).pipe(
      tap(data => this.leaderboardCache.set(key, data))
    );
  }

  getAlerts(openOnly = true, forceRefresh = false): Observable<PerformanceAlert[]> {
    if (!forceRefresh && this.alertsCache) {
      return of(this.alertsCache.filter(a => openOnly ? !a.resolved : true));
    }
    const params = new HttpParams().set('open', openOnly);
    return this.http.get<PerformanceAlert[]>(`${this.base}/alerts`, { params }).pipe(
      tap(data => {
        if (openOnly) {
           this.alertsCache = data;
        }
      })
    );
  }

  resolveAlert(alertId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/alerts/${alertId}/resolve`, {}).pipe(
      tap(() => {
        if (this.alertsCache) {
          const alert = this.alertsCache.find(a => a.id === alertId);
          if (alert) alert.resolved = true;
        }
      })
    );
  }
}
