import app, { configureRateLimiter } from './app.js';
import { config } from './config.js';
import { connectRedis } from './config/redis.js';

async function startServer() {
  try {
    // 1. Connect Redis first
    await connectRedis();
    console.log('Redis connected successfully');

    // 2. Initialize rate limiter after Redis connects
    configureRateLimiter();
    console.log('Rate limiter initialized');

    // 3. Start Express server
    app.listen(config.port, () => {
      console.log(
        `Email Template Generator API running on http://localhost:${config.port}`
      );
    });

  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();

