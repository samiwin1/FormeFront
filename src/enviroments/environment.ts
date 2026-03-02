const port = typeof window !== 'undefined' ? window.location.port : '';
const useNgProxy = port === '4200';

export const environment = {
  apiUrl: useNgProxy ? '/user-api' : 'http://localhost:8082/api',
  certificationApiUrl: useNgProxy ? '/api' : 'http://localhost:8090/api',
  gatewayApiUrl: 'http://localhost:8080/api'
};
