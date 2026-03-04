import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';

export type Profession = 'STUDENT' | 'DEVELOPER' | 'OTHER' | 'EVALUATOR' | 'UNKNOWN';
export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profession: Profession;
  active?: boolean;
  isActive?: boolean;
}

export interface CreateAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profession: Profession;
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private base = `${this.apiUrl}/admin`;

  create(payload: CreateAdminPayload) {
    return this.http.post<AdminUser>(`${this.base}/create`, payload);
  }

  list() {
    return this.http.get<AdminUser[]>(`${this.base}/list`);
  }

  disable(id: number) {
    return this.http.patch<void>(`${this.base}/${id}/disable`, {});
  }
}
