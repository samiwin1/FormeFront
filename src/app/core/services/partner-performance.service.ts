import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

  getPartnerKpis(partnerId: number, startDate?: string, endDate?: string): Observable<PartnerKpi> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PartnerKpi>(`${this.base}/partners/${partnerId}/kpis`, { params });
  }

  getDealPerformance(dealId: number): Observable<DealPerformance> {
    return this.http.get<DealPerformance>(`${this.base}/deals/${dealId}/performance`);
  }

  getLeaderboard(period: LeaderboardPeriod, metric: LeaderboardMetric, limit = 10): Observable<LeaderboardRow[]> {
    const params = new HttpParams()
      .set('period', period)
      .set('metric', metric)
      .set('limit', limit);

    return this.http.get<LeaderboardRow[]>(`${this.base}/leaderboard`, { params });
  }

  getAlerts(openOnly = true): Observable<PerformanceAlert[]> {
    const params = new HttpParams().set('open', openOnly);
    return this.http.get<PerformanceAlert[]>(`${this.base}/alerts`, { params });
  }

  resolveAlert(alertId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/alerts/${alertId}/resolve`, {});
  }
}
