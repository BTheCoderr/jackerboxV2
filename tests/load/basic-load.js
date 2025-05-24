import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    errors: ['rate<0.1'],              // Custom error rate under 10%
  },
};

const BASE_URL = 'http://localhost:3001';

export default function () {
  // Test home page load
  let homeResponse = http.get(`${BASE_URL}/`);
  check(homeResponse, {
    'home page status is 200': (r) => r.status === 200,
    'home page loads in <1s': (r) => r.timings.duration < 1000,
    'home page contains title': (r) => r.body.includes('Jackerbox') || r.body.includes('jackerBOX'),
  }) || errorRate.add(1);

  sleep(1);

  // Test equipment API
  let equipmentResponse = http.get(`${BASE_URL}/api/equipment`);
  check(equipmentResponse, {
    'equipment API status is 200': (r) => r.status === 200,
    'equipment API responds in <500ms': (r) => r.timings.duration < 500,
    'equipment API returns JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(1);

  // Test equipment search
  let searchResponse = http.get(`${BASE_URL}/api/equipment?query=camera`);
  check(searchResponse, {
    'search API status is 200': (r) => r.status === 200,
    'search API responds quickly': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test category filtering
  let categoryResponse = http.get(`${BASE_URL}/api/equipment?category=cameras`);
  check(categoryResponse, {
    'category filter status is 200': (r) => r.status === 200,
    'category filter responds quickly': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(2);

  // Test equipment browse page
  let browseResponse = http.get(`${BASE_URL}/routes/equipment`);
  check(browseResponse, {
    'browse page status is 200': (r) => r.status === 200,
    'browse page loads reasonably': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Test authentication endpoints
  let authResponse = http.get(`${BASE_URL}/api/auth/providers`);
  check(authResponse, {
    'auth providers status is 200': (r) => r.status === 200,
    'auth responds quickly': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);

  // Test payment intent creation (should work without auth for testing)
  let paymentPayload = JSON.stringify({ amount: 1000 });
  let paymentParams = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  let paymentResponse = http.post(`${BASE_URL}/api/payments/test-intent`, paymentPayload, paymentParams);
  check(paymentResponse, {
    'payment intent creation works': (r) => r.status === 200 || r.status === 400, // 400 is ok for validation
    'payment API responds in reasonable time': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1);

  sleep(1);

  // Test health check
  let healthResponse = http.get(`${BASE_URL}/api/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check is fast': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(2);
} 