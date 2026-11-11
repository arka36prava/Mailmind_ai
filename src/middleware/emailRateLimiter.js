import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';

export function createEmailRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 2,

    standardHeaders: 'draft-8',
    legacyHeaders: false,

    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'mailmind:rate-limit:'
    }),

    message: {
      success: false,
      message: 'Too many requests. Please try again after 15 minutes.'
    }
  });
}