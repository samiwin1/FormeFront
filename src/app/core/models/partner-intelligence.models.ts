export interface PartnerIntelligenceOverview {
  avgHealthScore: number;
  openAnomalies: number;
  pendingRecommendations: number;
  forecast30d: number;
}

export interface RecommendationItem {
  id: number;
  partnerId: number;
  actionTitle: string;
  rationale: string;
  priorityRank: number;
  confidence: number;
  status: string;
}

export interface AnomalyAlert {
  id: number;
  partnerId: number;
  anomalyType: string;
  severityScore: number;
  explanation: string;
  status: string;
}

export interface ForecastSnapshot {
  id: number;
  partnerId: number;
  horizon: string;
  predictedRevenue: number;
  confidence: number;
}

export interface PartnerInsightSummary {
  id: number;
  partnerId: number;
  summary: string;
  language: string;
}
