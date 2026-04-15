export interface FraudAlert {
    id: number;
    voucherCode: string;
    partnerId: number;
    alertType: string;
    severityLevel: number;
    detectionDetails: string;
    detectedAt: string;
    status: 'INVESTIGATION_PENDING' | 'CONFIRMED' | 'DISMISSED';
}
