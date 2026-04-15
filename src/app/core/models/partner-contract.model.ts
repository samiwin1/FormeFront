export interface PartnerContract {
    id: number;
    partnerId: number;
    title: string;
    status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
    startDate: string;
    endDate: string;
    commissionRate: number;
    termsAndConditions: string;
    createdAt: string;
    updatedAt: string;
}
