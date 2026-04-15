const port = typeof window !== 'undefined' ? window.location.port : '';
const useNgProxy = port === '4200';

export const environment = {
  apiUrl: useNgProxy ? '/user-api' : 'http://localhost:8082/api',
  formationApiUrl: useNgProxy ? '/formation-api' : 'http://localhost:8083/api',
  certificationApiUrl: useNgProxy ? '/api' : 'http://localhost:8090/api',
  gatewayApiUrl: useNgProxy ? '/user-api' : 'http://localhost:8082/api',
  mentorApiUrl: useNgProxy ? '/mentor-api' : 'http://localhost:8088',
};
