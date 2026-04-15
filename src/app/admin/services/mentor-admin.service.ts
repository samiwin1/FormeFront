import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/environment';
import { FormationDemandAggregateDto, RoleDemandCountDto } from '../../features/mentor/models/mentor.models';

export interface UsageStats {
  daily: { day: string; count: number }[];
  monthly: { month: string; count: number }[];
}
export interface FeedbackStats { up: number; down: number; }
export interface DemandStat { role: string; count: number; }
export interface TopStreak { userId: number; userName: string; streak: number; }

export interface UserSummaryItem {
  userId: number;
  currentRole: string;
  targetRole: string;
  experienceLevel: string;
  createdAt: string;
}

export interface UserSummary {
  userId: number;
  hasPortfolio: boolean;
  portfolio: {
    currentRole: string;
    targetRole: string;
    experienceLevel: string;
    learningStyle: string;
    weeklyStudyHours: number;
    skills: Array<{
      skillName: string;
      level: string;
    }>;
  };
  sessions: {
    total: number;
    byChannel: Record<string, number>;
    lastSessionAt: string;
  };
  feedback: {
    total: number;
    upCount: number;
    downCount: number;
    satisfactionRate: number;
    lastFeedbackAt: string;
  };
  studyPlans: {
    total: number;
    lastPlanTitle: string;
    lastPlanCreatedAt: string;
  };
  threads: {
    activeCount: number;
  };
  lastActiveAt: string;
}

@Injectable({ providedIn: 'root' })
export class MentorAdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${(environment as any).mentorApiUrl ?? environment.apiUrl}/mentor/admin/users`;
  private readonly demandsUrl = `${(environment as any).mentorApiUrl ?? environment.apiUrl}/mentor/admin/formation-demands`;
  private readonly statsUrl = `${(environment as any).mentorApiUrl ?? environment.apiUrl}/mentor/admin/stats`;

  getUsersWithPortfolios(): Observable<UserSummaryItem[]> {
    return this.http.get<UserSummaryItem[]>(this.baseUrl).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err instanceof HttpErrorResponse
          ? err.error?.message ?? err.message
          : 'Failed to load users';
        return throwError(() => new Error(message));
      })
    );
  }

  getUserSummary(userId: number): Observable<UserSummary> {
    return this.http.get<UserSummary>(`${this.baseUrl}/${userId}/summary`).pipe(
      catchError((err: HttpErrorResponse) => {
        const message = err instanceof HttpErrorResponse
          ? err.error?.message ?? err.message
          : 'Failed to load user summary';
        return throwError(() => new Error(message));
      })
    );
  }

  getFormationDemands(): Observable<FormationDemandAggregateDto[]> {
    return this.http.get<FormationDemandAggregateDto[]>(this.demandsUrl).pipe(
      catchError((err: HttpErrorResponse) => throwError(() => new Error(err.error?.message ?? err.message)))
    );
  }

  getFormationDemandsByRole(): Observable<RoleDemandCountDto[]> {
    return this.http.get<RoleDemandCountDto[]>(`${this.demandsUrl}/by-role`).pipe(
      catchError((err: HttpErrorResponse) => throwError(() => new Error(err.error?.message ?? err.message)))
    );
  }

  fulfillDemand(demandId: number): Observable<void> {
    return this.http.post<void>(`${this.demandsUrl}/${demandId}/fulfill`, {});
  }

  getUsageStats(): Observable<UsageStats> {
    return this.http.get<UsageStats>(`${this.statsUrl}/usage`);
  }

  getFormationDemandStats(): Observable<DemandStat[]> {
    return this.http.get<DemandStat[]>(`${this.statsUrl}/formation-demand`);
  }

  getFeedbackStats(): Observable<FeedbackStats> {
    return this.http.get<FeedbackStats>(`${this.statsUrl}/feedback`);
  }

  getTopStreaks(): Observable<TopStreak[]> {
    return this.http.get<TopStreak[]>(`${this.statsUrl}/top-streaks`);
  }
}