import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { FraudAlert } from '../models/fraud-alert.model';

@Injectable({
  providedIn: 'root'
})
export class VoucherFraudService {
  private apiUrl = environment.voucherFraudApiUrl;
  private alertsCache = new BehaviorSubject<FraudAlert[] | null>(null);

  constructor(private http: HttpClient) {}

  getAllAlerts(forceRefresh = false): Observable<FraudAlert[]> {
    if (!forceRefresh && this.alertsCache.value) {
      return of(this.alertsCache.value);
    }
    return this.http.get<FraudAlert[]>(`${this.apiUrl}/alerts`).pipe(
      tap(data => this.alertsCache.next(data))
    );
  }

  getAlertsByPartner(partnerId: number, forceRefresh = false): Observable<FraudAlert[]> {
    return this.http.get<FraudAlert[]>(`${this.apiUrl}/alerts/partner/${partnerId}`);
  }

  reportFraud(alert: Partial<FraudAlert>): Observable<FraudAlert> {
    return this.http.post<FraudAlert>(`${this.apiUrl}/detect`, alert).pipe(
      tap(() => this.alertsCache.next(null)) // Invalidate
    );
  }

  updateStatus(id: number, status: string): Observable<FraudAlert> {
    return this.http.put<FraudAlert>(`${this.apiUrl}/alerts/${id}/status?status=${status}`, {}).pipe(
      tap(() => this.alertsCache.next(null)) // Invalidate
    );
  }
}
