import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../enviroments/environment';

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserSummaryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  /** Admin / super-admin: batch lookup for display in rosters. */
  summariesByIds(userIds: number[]): Observable<UserSummary[]> {
    const unique = [...new Set(userIds.filter((id) => Number.isFinite(id) && id > 0))];
    if (unique.length === 0) {
      return of([]);
    }
    return this.http.post<UserSummary[]>(`${this.base}/summaries/by-ids`, unique);
  }
}
