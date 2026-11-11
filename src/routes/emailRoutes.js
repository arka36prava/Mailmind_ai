import { Router } from 'express';
import { createEmail } from '../controllers/emailController.js';


const router = Router();

router.post('/generate', (req, res, next) => {
  const { purpose, recipient_name, tone } = req.body || {};
  const errors = [];

  if (typeof purpose !== 'string' || !purpose.trim()) errors.push('purpose is required and must be a non-empty string.');
  if (typeof recipient_name !== 'string' || !recipient_name.trim()) errors.push('recipient_name is required and must be a non-empty string.');
  if (typeof tone !== 'string' || !tone.trim()) errors.push('tone is required and must be a non-empty string.');
  if (typeof purpose === 'string' && purpose.length > 1000) errors.push('purpose must not exceed 1000 characters.');
  if (typeof recipient_name === 'string' && recipient_name.length > 100) errors.push('recipient_name must not exceed 100 characters.');
  if (typeof tone === 'string' && tone.length > 50) errors.push('tone must not exceed 50 characters.');

  if (errors.length) return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  return createEmail(req, res, next);
});

export default router;
