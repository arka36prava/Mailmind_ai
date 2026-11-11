
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import emailRoutes from './routes/emailRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createEmailRateLimiter } from './middleware/emailRateLimiter.js';
import { requestMonitoring } from './middleware/monitoring.js';
import { register } from './config/metrics.js';

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.resolve(currentDir, '../public')));

app.use(requestMonitoring);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});



// Declare the limiter variable
let testRateLimiter;

export function configureRateLimiter() {
  // Initialize both limiters after Redis connects
  app.use('/api/emails', createEmailRateLimiter());
  testRateLimiter = createEmailRateLimiter();
}

// Register test route
app.get('/api/test-rate-limit', (req, res, next) => {
  testRateLimiter(req, res, next);
}, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Request allowed'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'RAG-powered AI Email Intelligence',
    status: 'running',
    endpoint: 'POST /api/emails/generate'
  });
});

app.use('/api/emails', emailRoutes);

app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: 'Route not found.'
  })
);

app.use(errorHandler);

export default app;



