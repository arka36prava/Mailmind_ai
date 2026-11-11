
import { config } from '../config.js';
import { generateEmail } from '../services/emailService.js';

export async function createEmail(req, res, next) {
  try {
    const { purpose, recipient_name, tone, forceRefresh = false } = req.body;

    const result = await generateEmail({
      purpose: purpose.trim(),
      recipient_name: recipient_name.trim(),
      tone: tone.trim(),
      forceRefresh
    });

    return res.status(200).json({
      success: true,

      data: {
        recipient_name: recipient_name.trim(),
        tone: tone.trim(),

        subject: result.email.subject,
        body: result.email.body,
        contextSummary: result.email.context_summary,

        retrievedSources: result.sources,

        // NEW: AI-powered email quality report
        qualityCheck: result.quality_check
      },

      meta: {
        model: config.geminiModel,
        embeddingModel: config.geminiEmbeddingModel,
        ragEnabled: true,
        indexedDocumentCount: result.indexedDocumentCount,

        // Existing performance metrics
        ...result.metrics,

        // NEW: Redis cache information
        cache: result.cache
      }
    });

  } catch (error) {
    next(error);
  }
}

