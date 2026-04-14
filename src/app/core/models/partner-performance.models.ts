export type LeaderboardPeriod = '7d' | '30d' | '90d';
export type LeaderboardMetric = 'redemptionRate' | 'redeemed' | 'issued' | 'revenue';

export interface PartnerKpi {
  partnerId: number;
  issued: number;
  redeemed: number;
  expired: number;
  redemptionRate: number;
  activeDeals: number;
  revenueMinor?: number | null;
  currency?: string | null;
}

export interface DealPerformance {
  dealId: number;
  issued: number;
  redeemed: number;
  expired: number;
  redemptionRate: number;
}

export interface LeaderboardRow {
  rank: number;
  partnerId: number;
  partnerName?: string;
  metric: LeaderboardMetric;
  value: number;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PerformanceAlert {
  id: number;
  createdAt: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  partnerId?: number | null;
  dealId?: number | null;
  resolved: boolean;
  resolvedAt?: string | null;
}
