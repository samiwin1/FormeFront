const port = typeof window !== 'undefined' ? window.location.port : '';
const useNgProxy = port === '4200';

export const environment = {
  apiUrl: useNgProxy ? '/user-api' : 'http://localhost:8082/api',
  formationApiUrl: useNgProxy ? '/formation-api' : 'http://localhost:8082/api',
  // Must match proxy: `/events-api` → `/api` on the root gateway (8082). Same pattern as user-api / formation-api.
  eventsApiUrl: useNgProxy ? '/events-api' : 'http://localhost:8082/api',
  certificationApiUrl: useNgProxy ? '/api' : 'http://localhost:8090/api',
  gatewayApiUrl: 'http://localhost:8082/api'
};
