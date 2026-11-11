
import {
  httpRequestsTotal,
  httpRequestDuration
} from '../config/metrics.js';

export function requestMonitoring(req, res, next) {
  if (req.path === '/metrics') {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration =
      Number(process.hrtime.bigint() - start) / 1e9;

    const route = req.route
      ? `${req.baseUrl}${req.route.path}`
      : req.path;

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
}
