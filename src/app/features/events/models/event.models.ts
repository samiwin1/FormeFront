export interface ForMeEvent {
  id?: number;
  title: string;
  description?: string;
  requirements?: string;
  successMetrics?: string;
  startDate: string;
  deadline: string;
  maxVip: number;
  maxGold: number;
  maxSilver: number;
  vipPrice?: number;
  goldPrice?: number;
  silverPrice?: number;
  currentVip?: number;
  currentGold?: number;
  currentSilver?: number;
  participantCount?: number;
  /** Present if this user is registered as a participant (from GET /events/:id with auth). */
  viewerHasJoined?: boolean;
  /** User has purchased a sponsorship tier for this event (cannot join as participant). */
  viewerIsSponsor?: boolean;
  /** Your admin mark when graded (catalog/detail with X-User-Id). */
  viewerScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventTeaserResponse {
  id: number;
  title: string;
  startDate: string;
  deadline: string;
  message: string;
  viewerHasJoined?: boolean;
  viewerScore?: number | null;
  maxVip?: number;
  maxGold?: number;
  maxSilver?: number;
  vipPrice?: number;
  goldPrice?: number;
  silverPrice?: number;
  currentVip?: number;
  currentGold?: number;
  currentSilver?: number;
}

/** Teaser DTO includes `message` and does not include `description` (see EventTeaserResponse on server). */
export function isEventTeaser(data: ForMeEvent | EventTeaserResponse): data is EventTeaserResponse {
  return data != null && typeof data === 'object' && 'message' in data && !('description' in data);
}

export interface DepositResponse {
  depositId: number;
  participantId: number;
  userId: number;
  zipOriginalFilename: string;
  readmeOriginalFilename: string;
  submittedAt: string;
  readmeHint?: string;
}

export interface AiMessageResponse {
  reply: string;
}

/** Admin roster for an event (joined users + optional submission metadata). */
export interface AdminParticipantRow {
  participantId: number;
  userId: number;
  joinedAt: string;
  score: number | null;
  depositId: number | null;
  zipOriginalFilename: string | null;
  readmeOriginalFilename: string | null;
  submittedAt: string | null;
  readmeHint: string | null;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  requirements: string;
  successMetrics: string;
  startDate: string;
  deadline: string;
  maxVip: number;
  maxGold: number;
  maxSilver: number;
  vipPrice: number;
  goldPrice: number;
  silverPrice: number;
}
