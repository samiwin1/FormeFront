export interface Feedback {
  id?: number;
  partnerId?: number;
  packId?: number;
  dealId?: number;
  rating?: number;
  title?: string;
  comment?: string;
  category?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  createdAt?: string;
}

export interface FeedbackResponse {
  id?: number;
  feedbackId?: number;
  adminId?: number;
  response?: string;
  suggestedResponse?: string;
  respondedAt?: string;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  pendingFeedbacks: number;
  approvedFeedbacks: number;
  rejectedFeedbacks: number;
  positiveFeedbacks: number;
  neutralFeedbacks: number;
  negativeFeedbacks: number;
  globalAverageRating: number;
}

export const FEEDBACK_CATEGORIES = ['SUPPORT', 'CONTENT', 'DELIVERY', 'PRICE', 'OVERALL'];