import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const res = http.get(`${BASE}/api/products?size=12`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'tiene productos': (r) => r.json('content').length > 0,
  });
  sleep(1);
}
