import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Feedback, FeedbackResponse, FeedbackStats } from '../models/feedback.models';

@Injectable({ providedIn: 'root' })
export class FeedbackService {

  private base = 'http://localhost:8082/api/feedbacks';

  constructor(private http: HttpClient) {}

  // =============================
  // BASIC CRUD
  // =============================

  getAll(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.base);
  }

  getById(id: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.base}/${id}`);
  }

  create(feedback: Feedback): Observable<Feedback> {
    return this.http.post<Feedback>(this.base, feedback);
  }

  update(id: number, feedback: Feedback): Observable<Feedback> {
    return this.http.put<Feedback>(`${this.base}/${id}`, feedback);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // =============================
  // STATS
  // =============================

  getStats(): Observable<FeedbackStats> {
    return this.http.get<FeedbackStats>(`${this.base}/stats`);
  }

  // =============================
  // APPROVAL
  // =============================

  approve(id: number): Observable<Feedback> {
    return this.http.patch<Feedback>(`${this.base}/${id}/approve`, {});
  }

  reject(id: number): Observable<Feedback> {
    return this.http.patch<Feedback>(`${this.base}/${id}/reject`, {});
  }

  // =============================
  // RESPONSES (AI + CUSTOM)
  // =============================

  getResponse(feedbackId: number): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${this.base}/${feedbackId}/response`);
  }

  suggestAiResponse(feedbackId: number): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(
      `${this.base}/${feedbackId}/response/suggest`,
      {}
    );
  }

  acceptSuggestion(feedbackId: number): Observable<FeedbackResponse> {
    return this.http.patch<FeedbackResponse>(
      `${this.base}/${feedbackId}/response/accept`,
      {}
    );
  }

  writeCustomResponse(feedbackId: number, responseText: string): Observable<FeedbackResponse> {
    return this.http.patch<FeedbackResponse>(
      `${this.base}/${feedbackId}/response/custom`,
      { response: responseText }
    );
  }

  // =============================
  // PARTNER
  // =============================

  getByPartner(partnerId: number): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.base}/partner/${partnerId}`);
  }
}