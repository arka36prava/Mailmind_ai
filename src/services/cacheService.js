
import crypto from 'node:crypto';
import { redisClient } from '../config/redis.js';

export function createEmailCacheKey({ purpose, recipient_name, tone }) {
  const input = JSON.stringify({
    purpose: purpose.trim().toLowerCase(),
    recipient: recipient_name.trim().toLowerCase(),
    tone: tone.trim().toLowerCase(),
    model: process.env.GEMINI_MODEL,
    version: 'v1'
  });

  const hash = crypto
    .createHash('sha256')
    .update(input)
    .digest('hex');

  return `mailmind:email:${hash}`;
}

export async function getCachedEmail(key) {
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function setCachedEmail(key, value) {
  await redisClient.set(key, JSON.stringify(value), {
    EX: 86400
  });
}