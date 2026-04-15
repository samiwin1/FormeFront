import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Partner, Deal, Pack, AccessCode } from '../models/business.models';
import { environment } from '../../../enviroments/environment';

export interface PartnerStats {
  totalDeals: number;
  usedCodes: number;
}

export interface PartnerWithStats extends Partner {
  stats?: PartnerStats;
  loadingStats?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BusinessService {

  private readonly base = environment.businessApiUrl;

  private partnersCache = new BehaviorSubject<Partner[] | null>(null);
  private dealsCache = new BehaviorSubject<Deal[] | null>(null);
  private packsCache = new BehaviorSubject<Pack[] | null>(null);
  private accessCodesCache = new BehaviorSubject<AccessCode[] | null>(null);

  constructor(private http: HttpClient) {}

  // ── Partners ────────────────────────────────────────────────────────────
  getPartners(forceRefresh = false): Observable<Partner[]> {
    if (!forceRefresh && this.partnersCache.value) {
      return of(this.partnersCache.value);
    }
    return this.http.get<Partner[]>(`${this.base}/partners`).pipe(
      tap(res => this.partnersCache.next(res))
    );
  }
  getPartner(id: number): Observable<Partner> {
    return this.http.get<Partner>(`${this.base}/partners/${id}`);
  }
  createPartner(p: Partner): Observable<Partner> {
    return this.http.post<Partner>(`${this.base}/partners`, p).pipe(
      tap(() => this.partnersCache.next(null))
    );
  }
  updatePartner(id: number, p: Partner): Observable<Partner> {
    return this.http.put<Partner>(`${this.base}/partners/${id}`, p).pipe(
      tap(() => this.partnersCache.next(null))
    );
  }
  deletePartner(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/partners/${id}`).pipe(
      tap(() => this.partnersCache.next(null))
    );
  }

  getPartnerStats(id: number): Observable<PartnerStats> {
    return this.http.get<PartnerStats>(`${this.base}/partners/${id}/stats`);
  }

  // ── Deals ───────────────────────────────────────────────────────────────
  getDeals(forceRefresh = false): Observable<Deal[]> {
    if (!forceRefresh && this.dealsCache.value) {
      return of(this.dealsCache.value);
    }
    return this.http.get<Deal[]>(`${this.base}/deals`).pipe(
      tap(res => this.dealsCache.next(res))
    );
  }
  getDeal(id: number): Observable<Deal> {
    return this.http.get<Deal>(`${this.base}/deals/${id}`);
  }
  createDeal(d: Deal): Observable<Deal> {
    return this.http.post<Deal>(`${this.base}/deals`, d).pipe(
      tap(() => { this.dealsCache.next(null); this.partnersCache.next(null); })
    );
  }
  updateDeal(id: number, d: Deal): Observable<Deal> {
    return this.http.put<Deal>(`${this.base}/deals/${id}`, d).pipe(
      tap(() => { this.dealsCache.next(null); this.partnersCache.next(null); })
    );
  }
  deleteDeal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/deals/${id}`).pipe(
      tap(() => { this.dealsCache.next(null); this.partnersCache.next(null); })
    );
  }

  // ── Packs ───────────────────────────────────────────────────────────────
  getPacks(forceRefresh = false): Observable<Pack[]> {
    if (!forceRefresh && this.packsCache.value) {
      return of(this.packsCache.value);
    }
    return this.http.get<Pack[]>(`${this.base}/packs`).pipe(
      tap(res => this.packsCache.next(res))
    );
  }
  getPack(id: number): Observable<Pack> {
    return this.http.get<Pack>(`${this.base}/packs/${id}`);
  }
  createPack(p: Pack): Observable<Pack> {
    return this.http.post<Pack>(`${this.base}/packs`, p).pipe(
      tap(() => this.packsCache.next(null))
    );
  }
  updatePack(id: number, p: Pack): Observable<Pack> {
    return this.http.put<Pack>(`${this.base}/packs/${id}`, p).pipe(
      tap(() => this.packsCache.next(null))
    );
  }
  deletePack(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/packs/${id}`).pipe(
      tap(() => this.packsCache.next(null))
    );
  }

  // ── Access Codes ─────────────────────────────────────────────────────────
  getAccessCodes(forceRefresh = false): Observable<AccessCode[]> {
    if (!forceRefresh && this.accessCodesCache.value) {
      return of(this.accessCodesCache.value);
    }
    return this.http.get<AccessCode[]>(`${this.base}/access-codes`).pipe(
      tap(res => this.accessCodesCache.next(res))
    );
  }
  getAccessCode(id: number): Observable<AccessCode> {
    return this.http.get<AccessCode>(`${this.base}/access-codes/${id}`);
  }
  createAccessCode(a: AccessCode): Observable<AccessCode> {
    return this.http.post<AccessCode>(`${this.base}/access-codes`, a).pipe(
      tap(() => this.accessCodesCache.next(null))
    );
  }
  updateAccessCode(id: number, a: AccessCode): Observable<AccessCode> {
    return this.http.put<AccessCode>(`${this.base}/access-codes/${id}`, a).pipe(
      tap(() => this.accessCodesCache.next(null))
    );
  }
  deleteAccessCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/access-codes/${id}`).pipe(
      tap(() => this.accessCodesCache.next(null))
    );
  }
}
