const port = typeof window !== 'undefined' ? window.location.port : '';
const useNgProxy = port === '4200';

export const environment = {
  apiUrl: useNgProxy ? '/user-api' : 'http://localhost:8082/api',
  formationApiUrl: useNgProxy ? '/formation-api' : 'http://localhost:8083/api',
  certificationApiUrl: useNgProxy ? '/api' : 'http://localhost:8090/api',
  gatewayApiUrl: useNgProxy ? '/user-api' : 'http://localhost:8082/api',
  shopApiUrl: useNgProxy ? '/shop-api' : 'http://localhost:8082/api/shop',
  paymentApiUrl: useNgProxy ? '/payments-api' : 'http://localhost:8082/api/payments',
  documentApiUrl: useNgProxy ? '/document-api' : 'http://localhost:8085/api',
  articleApiUrl: useNgProxy ? '/article-api' : 'http://localhost:8082/api',
  eventsApiUrl: useNgProxy ? '/events-api' : 'http://localhost:8082/api',
  mentorApiUrl: useNgProxy ? '/mentor-api' : 'http://localhost:8088',
  businessApiUrl: useNgProxy ? '/api' : 'http://localhost:8082/api',
  partnerPerformanceApiUrl: useNgProxy ? '/api/partner-performance' : 'http://localhost:8082/api/partner-performance',
  partnerContractApiUrl: useNgProxy ? '/api/partner-contracts' : 'http://localhost:8082/api/partner-contracts',
  partnerBillingApiUrl: useNgProxy ? '/api/partner-billing' : 'http://localhost:8082/api/partner-billing',
  partnerIntelligenceApiUrl: useNgProxy ? '/api/partner-intelligence' : 'http://localhost:8082/api/partner-intelligence',
  voucherFraudApiUrl: useNgProxy ? '/api/voucher-fraud' : 'http://localhost:8082/api/voucher-fraud',
  // Stripe Publishable key (frontend only). Secret key (sk_...) must stay in backend config.
  stripePublishableKey: 'pk_test_51QxSSXChmhEZInbmW8zEHsoc7tbqeDnZs8sZMx2SgHUKOdhFhBxOBBWnaN4iLoZyBDmao6objazdCSqEQ2tgO7Ay00qOYahLwC'
};
