/**
 * Feedback Analytics Models for Admin Dashboard
 */

export type SentimentFilter = 'UP' | 'DOWN' | 'ALL';

export interface FeedbackStatistics {
  totalFeedback: number;
  upCount: number;
  downCount: number;
  satisfactionRate: number; // 0-100 percentage
  sentiment: SentimentData;
}

export interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
}

export interface FeedbackTrend {
  date: string; // ISO date YYYY-MM-DD
  upCount: number;
  downCount: number;
  satisfactionRate: number;
}

export interface MentorFeedbackStats {
  mentorId?: number;
  mentorName: string;
  totalFeedback: number;
  upCount: number;
  downCount: number;
  satisfactionRate: number;
  recentComments: string[];
}

export interface FormationFeedbackStats {
  formationId?: number;
  formationName: string;
  totalFeedback: number;
  upCount: number;
  downCount: number;
  satisfactionRate: number;
}

export interface FeedbackComment {
  id: number;
  mentorId?: number;
  mentorName: string;
  formationId?: number;
  formationName: string;
  comment: string;
  rating: 'UP' | 'DOWN';
  createdAt: string;
}

export interface FeedbackAnalyticsFilters {
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  formationIds?: number[];
  mentorIds?: number[];
  sentiment: SentimentFilter;
  timeRange?: '7' | '30' | '90'; // days
}

export interface FeedbackAnalyticsDashboardData {
  statistics: FeedbackStatistics;
  trends: FeedbackTrend[];
  topMentors: MentorFeedbackStats[];
  bottomMentors: MentorFeedbackStats[];
  formationStats: FormationFeedbackStats[];
  recentComments: FeedbackComment[];
}
