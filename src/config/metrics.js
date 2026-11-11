
import client from 'prom-client';

export const register = new client.Registry();

client.collectDefaultMetrics({
  register
});

// Total HTTP requests
export const httpRequestsTotal = new client.Counter({
  name: 'mailmind_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// API response time
export const httpRequestDuration = new client.Histogram({
  name: 'mailmind_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register]
});
