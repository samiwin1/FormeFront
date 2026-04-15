import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { environment } from '../../../enviroments/environment';
import { PartnerContract } from '../models/partner-contract.model';

@Injectable({
  providedIn: 'root'
})
export class PartnerContractService {
  private apiUrl = environment.partnerContractApiUrl;
  private contractsCache = new BehaviorSubject<PartnerContract[] | null>(null);

  constructor(private http: HttpClient) {}

  getAllContracts(forceRefresh = false): Observable<PartnerContract[]> {
    if (!forceRefresh && this.contractsCache.value) {
      return of(this.contractsCache.value);
    }
    return this.http.get<PartnerContract[]>(this.apiUrl).pipe(
      tap(data => this.contractsCache.next(data))
    );
  }

  getContractsByPartner(partnerId: number): Observable<PartnerContract[]> {
    return this.http.get<PartnerContract[]>(`${this.apiUrl}/partner/${partnerId}`);
  }

  getContract(id: number): Observable<PartnerContract> {
    return this.http.get<PartnerContract>(`${this.apiUrl}/${id}`);
  }

  createContract(contract: Partial<PartnerContract>): Observable<PartnerContract> {
    return this.http.post<PartnerContract>(this.apiUrl, contract).pipe(
      tap(() => this.contractsCache.next(null))
    );
  }

  updateStatus(id: number, status: string): Observable<PartnerContract> {
    return this.http.put<PartnerContract>(`${this.apiUrl}/${id}/status?status=${status}`, {}).pipe(
      tap(() => this.contractsCache.next(null))
    );
  }

  deleteContract(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.contractsCache.next(null))
    );
  }
}
