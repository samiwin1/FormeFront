import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../enviroments/environment';
import { AuthService } from '../../../core/services/auth.service';
import {
  AdminParticipantRow,
  AiMessageResponse,
  CreateEventPayload,
  DepositResponse,
  EventTeaserResponse,
  ForMeEvent,
} from '../models/event.models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly base = `${environment.eventsApiUrl}/events`;

  private viewerHeaders(): HttpHeaders {
    let h = new HttpHeaders();
    const uid = this.auth.getUserId();
    if (uid != null) {
      h = h.set('X-User-Id', String(uid));
    }
    if (this.auth.isAdmin()) {
      h = h.set('X-Viewer-Role', 'ADMIN');
    } else {
      h = h.set('X-Viewer-Role', 'USER');
    }
    return h;
  }

  private adminHeaders(): HttpHeaders {
    let h = this.viewerHeaders();
    return h.set('X-Viewer-Role', 'ADMIN');
  }

  /** Public list; sends viewer headers so joined users see their mark on each card when graded. */
  getCatalog(): Observable<ForMeEvent[]> {
    return this.http.get<ForMeEvent[]>(`${this.base}/catalog`, { headers: this.viewerHeaders() });
  }

  /** Admin-only list (same data; use when in backoffice). */
  adminList(): Observable<ForMeEvent[]> {
    return this.http.get<ForMeEvent[]>(`${this.base}`, { headers: this.adminHeaders() });
  }

  getOne(id: number): Observable<ForMeEvent | EventTeaserResponse> {
    return this.http.get<ForMeEvent | EventTeaserResponse>(`${this.base}/${id}`, {
      headers: this.viewerHeaders(),
    });
  }

  join(eventId: number): Observable<unknown> {
    const uid = this.auth.getUserId();
    if (uid == null) {
      throw new Error('You must be logged in to join an event.');
    }
    return this.http.post(`${this.base}/${eventId}/join`, {}, { headers: this.viewerHeaders() });
  }

  create(payload: CreateEventPayload): Observable<ForMeEvent> {
    return this.http.post<ForMeEvent>(`${this.base}`, payload, { headers: this.adminHeaders() });
  }

  update(eventId: number, payload: CreateEventPayload): Observable<ForMeEvent> {
    return this.http.put<ForMeEvent>(`${this.base}/${eventId}`, payload, { headers: this.adminHeaders() });
  }

  delete(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${eventId}`, { headers: this.adminHeaders() });
  }

  /** Current user's submission for an event, or `null` if none / 404. */
  getMyDeposit(eventId: number): Observable<DepositResponse | null> {
    return this.http.get<DepositResponse>(`${this.base}/${eventId}/deposits/me`, { headers: this.viewerHeaders() }).pipe(
      catchError((err) => {
        if (err?.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  /** Multipart: `zipFile` (.zip) + `readmeFile` (README.md or README.txt). Requires join first. One submission per event. */
  submitDeposit(eventId: number, zipFile: File, readmeFile: File): Observable<DepositResponse> {
    const uid = this.auth.getUserId();
    if (uid == null) {
      throw new Error('You must be logged in to submit.');
    }
    const fd = new FormData();
    fd.append('zipFile', zipFile);
    fd.append('readmeFile', readmeFile);
    return this.http.post<DepositResponse>(`${this.base}/${eventId}/deposits`, fd, { headers: this.viewerHeaders() });
  }

  participantChat(eventId: number, message: string): Observable<AiMessageResponse> {
    return this.http.post<AiMessageResponse>(
      `${this.base}/${eventId}/ai/participant-chat`,
      { message },
      { headers: this.viewerHeaders() }
    );
  }

  /** Admin: all users who joined, with deposit summary when submitted. */
  adminListParticipants(eventId: number): Observable<AdminParticipantRow[]> {
    return this.http.get<AdminParticipantRow[]>(`${this.base}/${eventId}/participants`, {
      headers: this.adminHeaders(),
    });
  }

  /** Admin: set participant mark / score (0–100). */
  adminUpdateParticipantScore(
    eventId: number,
    participantId: number,
    score: number
  ): Observable<AdminParticipantRow> {
    return this.http.put<AdminParticipantRow>(
      `${this.base}/${eventId}/participants/${participantId}/score`,
      { score },
      { headers: this.adminHeaders() }
    );
  }

  /** Admin: AI Q&A grounded in the participant README for this deposit. */
  adminReadmeChat(depositId: number, message: string): Observable<AiMessageResponse> {
    return this.http.post<AiMessageResponse>(
      `${this.base}/deposits/${depositId}/ai/readme-chat`,
      { message },
      { headers: this.adminHeaders() }
    );
  }

  /** Sponsor (or admin): readme Q&A with viewer headers — required for non-admin sponsors. */
  viewerReadmeChat(depositId: number, message: string): Observable<AiMessageResponse> {
    return this.http.post<AiMessageResponse>(
      `${this.base}/deposits/${depositId}/ai/readme-chat`,
      { message },
      { headers: this.viewerHeaders() }
    );
  }

  /** Sponsor read-only roster (requires sponsor row for this event). */
  sponsorListParticipants(eventId: number): Observable<AdminParticipantRow[]> {
    return this.http.get<AdminParticipantRow[]>(`${this.base}/${eventId}/sponsor/participants`, {
      headers: this.viewerHeaders(),
    });
  }

  /**
   * Download submission ZIP. Use `admin` from the admin backoffice; `viewer` for event sponsors
   * (requires `X-User-Id` and sponsor row).
   */
  downloadDepositZip(
    eventId: number,
    depositId: number,
    mode: 'admin' | 'viewer' = 'admin'
  ): Observable<Blob> {
    const headers = mode === 'admin' ? this.adminHeaders() : this.viewerHeaders();
    return this.http.get(`${this.base}/${eventId}/deposits/${depositId}/zip`, {
      headers,
      responseType: 'blob',
    });
  }

  /** Any logged-in user may purchase a tier; `X-User-Id` identifies the sponsor. */
  buyPartnerTier(eventId: number, tier: 'VIP' | 'GOLD' | 'SILVER'): Observable<unknown> {
    const uid = this.auth.getUserId();
    if (uid == null) {
      throw new Error('You must be logged in to sponsor a tier.');
    }
    let h = this.viewerHeaders();
    const email = this.auth.getEmail();
    if (email) {
      h = h.set('X-Partner-Email', email);
    }
    return this.http.post(`${this.base}/${eventId}/partners/buy?tier=${tier}`, {}, { headers: h });
  }
}
