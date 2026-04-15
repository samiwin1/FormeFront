import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { AuthService } from './auth.service';

export interface UserMeDto {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  partnerId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  private readonly meSubject = new BehaviorSubject<UserMeDto | null>(null);
  readonly me$ = this.meSubject.asObservable();

  get meSnapshot(): UserMeDto | null {
    return this.meSubject.value;
  }

  get partnerId(): number | null {
    const p = this.meSubject.value?.partnerId;
    return p != null && p > 0 ? p : null;
  }

  /** Loads /users/me when logged in; clears partner id when logged out. */
  refreshMe(): Observable<UserMeDto | null> {
    const token = this.auth.getToken();
    if (!token) {
      this.meSubject.next(null);
      return of(null);
    }
    return this.http
      .get<UserMeDto>(`${this.apiUrl}/users/me`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      })
      .pipe(
        tap((u) => this.meSubject.next(u)),
        catchError(() => {
          this.meSubject.next(null);
          return of(null);
        })
      );
  }
}
