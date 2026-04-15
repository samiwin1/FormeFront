export interface PartnerInvoice {
  id?: number;
  partnerId: number;
  invoiceNumber?: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  status?: string;
  details?: string;
  issuedAt?: string;
  paidAt?: string;
}