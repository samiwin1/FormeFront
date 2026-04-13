import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface AuthResponse { token: string; }

type JwtPayload = {
  roles?: string[];
  uid?: number;
  sub?: string;
  exp?: number;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'forme_token';
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedInSubject.asObservable();

  private apiUrl = 'http://localhost:8082/api';

  constructor(private http: HttpClient) {}

  register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profession?: string;
    partnerId?: number | null;
    partnerCode?: string | null;
  }) {
    return this.http.post<void>(`${this.apiUrl}/auth/register`, payload);
  }

  login(payload: { email: string; password: string }) {
    console.log('Attempting login for:', payload.email);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap(res => {
        console.log('Login response received:', res);
        if (res && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.loggedInSubject.next(true);
          console.log('Token saved, session active.');
        } else {
          console.error('Login successful but no token found in response:', res);
          throw new Error('NO_JWT_IN_RESPONSE');
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.loggedInSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAdmin(): boolean {
    const roles = this.getRoles();
    return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN');
  }

  isSuperAdmin(): boolean {
    return this.getRoles().includes('ROLE_SUPER_ADMIN');
  }

  getPayload(): JwtPayload | null {
    return this.decodeToken();
  }

  getEmail(): string | null {
    return this.decodeToken()?.sub ?? null;
  }

  getUserId(): number | null {
    return this.decodeToken()?.uid ?? null;
  }

  getRoles(): string[] {
    return this.decodeToken()?.roles ?? [];
  }

  private decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}