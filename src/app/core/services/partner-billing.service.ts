import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PartnerInvoice } from '../models/partner-invoice.model';
import { environment } from '../../../enviroments/environment';

@Injectable({
  providedIn: 'root'
})
export class PartnerBillingService {
  private readonly apiUrl = environment.partnerBillingApiUrl;
  private invoicesCache = new BehaviorSubject<PartnerInvoice[] | null>(null);

  constructor(private http: HttpClient) {}

  getAllInvoices(forceRefresh = false): Observable<PartnerInvoice[]> {
    if (!forceRefresh && this.invoicesCache.value) {
      return of(this.invoicesCache.value);
    }
    return this.http.get<PartnerInvoice[]>(`${this.apiUrl}/invoices`).pipe(
      tap(res => this.invoicesCache.next(res))
    );
  }

  getInvoicesByPartner(partnerId: number): Observable<PartnerInvoice[]> {
    return this.http.get<PartnerInvoice[]>(`${this.apiUrl}/invoices/partner/${partnerId}`);
  }

  getInvoice(id: number): Observable<PartnerInvoice> {
    return this.http.get<PartnerInvoice>(`${this.apiUrl}/invoices/${id}`);
  }

  generateInvoice(invoice: PartnerInvoice): Observable<PartnerInvoice> {
    return this.http.post<PartnerInvoice>(`${this.apiUrl}/invoices/generate`, invoice).pipe(
      tap(() => this.invoicesCache.next(null))
    );
  }

  markAsPaid(id: number): Observable<PartnerInvoice> {
    return this.http.put<PartnerInvoice>(`${this.apiUrl}/invoices/${id}/pay`, {}).pipe(
      tap(() => this.invoicesCache.next(null))
    );
  }

  updateStatus(id: number, status: string): Observable<PartnerInvoice> {
    return this.http.put<PartnerInvoice>(`${this.apiUrl}/invoices/${id}/status?status=${status}`, {}).pipe(
      tap(() => this.invoicesCache.next(null))
    );
  }
}
