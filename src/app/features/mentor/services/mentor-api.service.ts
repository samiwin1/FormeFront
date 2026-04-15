import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import {
  BookmarkToggleResponse,
  BookmarkedAdviceDto,
  DifficultyAlert,
  FeedbackResponseDto,
  ItemCompleteResponseDto,
  MentorAdviceResponseDto,
  MentorAskRequest,
  PageBookmarks,
  PageMentorHistory,
  PortfolioExistsResponse,
  PortfolioResponseDto,
  PortfolioUpsertRequest,
  StreakResponseDto,
  StudyPlanResponseDto,
  ThreadDetailDto,
  ThreadSummaryDto,
} from '../models/mentor.models';

@Injectable({ providedIn: 'root' })
export class MentorApiService {
  private readonly baseUrl = `${environment.mentorApiUrl}/mentor`;

  constructor(private http: HttpClient) {}

  portfolioExists(): Observable<PortfolioExistsResponse> {
    return this.http.get<PortfolioExistsResponse>(`${this.baseUrl}/portfolio/exists`);
  }

  getPortfolio(): Observable<PortfolioResponseDto> {
    return this.http.get<PortfolioResponseDto>(`${this.baseUrl}/portfolio`);
  }

  upsertPortfolio(body: PortfolioUpsertRequest): Observable<PortfolioResponseDto> {
    return this.http.put<PortfolioResponseDto>(`${this.baseUrl}/portfolio`, body);
  }

  ask(body: MentorAskRequest): Observable<MentorAdviceResponseDto> {
    return this.http.post<MentorAdviceResponseDto>(`${this.baseUrl}/ask`, body);
  }

  preExamTips(formationId: number, locale?: string): Observable<MentorAdviceResponseDto> {
    let params = new HttpParams();
    if (locale?.trim()) {
      params = params.set('locale', locale.trim());
    }
    return this.http.get<MentorAdviceResponseDto>(`${this.baseUrl}/pre-exam-tips/${formationId}`, { params });
  }

  adviceHistory(page = 0, size = 10): Observable<PageMentorHistory> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageMentorHistory>(`${this.baseUrl}/advice/history`, { params });
  }

  getLearningPath(refresh = false): Observable<MentorAdviceResponseDto> {
    const params = new HttpParams().set('refresh', String(refresh));
    return this.http.get<MentorAdviceResponseDto>(`${this.baseUrl}/learning-path`, { params });
  }

  // ── Feedback ──────────────────────────────────────────────────────────────

  submitFeedback(sessionId: number, rating: 'UP' | 'DOWN', comment?: string): Observable<FeedbackResponseDto> {
    return this.http.post<FeedbackResponseDto>(`${this.baseUrl}/feedback`, { sessionId, rating, comment });
  }

  // ── Conversation threads ──────────────────────────────────────────────────

  getThreads(): Observable<ThreadSummaryDto[]> {
    return this.http.get<ThreadSummaryDto[]>(`${this.baseUrl}/threads`);
  }

  createThread(title?: string, formationId?: number): Observable<ThreadDetailDto> {
    return this.http.post<ThreadDetailDto>(`${this.baseUrl}/threads`, { title, formationId });
  }

  getThread(threadId: number): Observable<ThreadDetailDto> {
    return this.http.get<ThreadDetailDto>(`${this.baseUrl}/threads/${threadId}`);
  }

  archiveThread(threadId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/threads/${threadId}`);
  }

  // ── Adaptive difficulty ────────────────────────────────────────────────────

  getDifficultyAlerts(): Observable<DifficultyAlert[]> {
    return this.http.get<DifficultyAlert[]>(`${this.baseUrl}/difficulty-alerts`);
  }

  getRemediation(formationId: number): Observable<MentorAdviceResponseDto> {
    return this.http.post<MentorAdviceResponseDto>(`${this.baseUrl}/remediation/${formationId}`, {});
  }

  // ── Study plans ────────────────────────────────────────────────────────────

  getStudyPlans(): Observable<StudyPlanResponseDto[]> {
    return this.http.get<StudyPlanResponseDto[]>(`${this.baseUrl}/study-plans`);
  }

  completeStudyPlanItem(itemId: number): Observable<ItemCompleteResponseDto> {
    return this.http.post<ItemCompleteResponseDto>(
      `${this.baseUrl}/study-plans/items/${itemId}/complete`, {}
    );
  }

  // ── Streak ────────────────────────────────────────────────────────────────

  getStreak(): Observable<StreakResponseDto> {
    return this.http.get<StreakResponseDto>(`${this.baseUrl}/streak`);
  }

  // ── Bookmarks ──────────────────────────────────────────────────────────────

  toggleBookmark(sessionId: number, note?: string): Observable<BookmarkToggleResponse> {
    const params = note ? `?note=${encodeURIComponent(note)}` : '';
    return this.http.post<BookmarkToggleResponse>(
      `${this.baseUrl}/advice/${sessionId}/bookmark${params}`, {}
    );
  }

  getBookmarks(page = 0, size = 10): Observable<PageBookmarks> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageBookmarks>(`${this.baseUrl}/advice/bookmarks`, { params });
  }

  // ── Weekly brief ───────────────────────────────────────────────────────────

  weeklyBrief(locale?: string): Observable<MentorAdviceResponseDto> {
    let params = new HttpParams();
    if (locale?.trim()) {
      params = params.set('locale', locale.trim());
    }
    return this.http.get<MentorAdviceResponseDto>(`${this.baseUrl}/weekly-brief`, { params });
  }
}
