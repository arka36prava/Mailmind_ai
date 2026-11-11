
import { config } from '../config.js';
import { callGemini } from './geminiClient.js';
import { retrieveRelevantContext } from './retrievalService.js';
import { checkEmailQuality } from './qualityCheckService.js';
import {
  createEmailCacheKey,
  getCachedEmail,
  setCachedEmail
} from './cacheService.js';

function extractJson(text) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    throw new Error('The AI returned an unexpected response format.');
  }
}

export async function generateEmail({
  purpose,
  recipient_name,
  tone,
  forceRefresh = false
}) {
  const totalStartedAt = Date.now();

  // STEP 1: Generate a unique cache key
  const cacheKey = createEmailCacheKey({
    purpose,
    recipient_name,
    tone
  });

  // STEP 2: Check Redis before calling Gemini
  if (!forceRefresh) {
    try {
      const cached = await getCachedEmail(cacheKey);

      if (cached) {
        const cacheTimeMs = Date.now() - totalStartedAt;

        console.log(JSON.stringify({
          event: 'email_cache_hit',
          timestamp: new Date().toISOString(),
          cacheTimeMs
        }));

        return {
          ...cached,
          cache: {
            hit: true,
            source: 'redis'
          },
          metrics: {
            ...cached.metrics,
            cacheTimeMs,
            totalAiTimeMs: cacheTimeMs
          }
        };
      }
    } catch (error) {
      console.error('Redis cache read failed:', error.message);
      // Continue with normal RAG generation
    }
  } else {
    console.log('Force refresh requested. Skipping Redis cache lookup.');
  }

  // STEP 3: Cache miss or force refresh - execute RAG pipeline
  const retrievalQuery =
    `Generate an email for this purpose: ${purpose}. ` +
    `Recipient: ${recipient_name}. Desired tone: ${tone}. ` +
    `Find relevant tone, structure, and accuracy guidelines.`;

  const retrieval = await retrieveRelevantContext(retrievalQuery, 3);

  const retrievedContext = retrieval.matches.map((item, index) =>
    `[Context ${index + 1}: ${item.title} | relevance ${(item.score * 100).toFixed(1)}%]\n${item.content}`
  ).join('\n\n');

  const prompt = `You are an expert business email writing assistant. Create a short, useful email using the user's inputs and the retrieved communication knowledge.

USER INPUT
Purpose: ${purpose}
Recipient name: ${recipient_name}
Tone: ${tone}

RETRIEVED KNOWLEDGE (use only where relevant)
${retrievedContext}

INSTRUCTIONS
- Address the recipient by the supplied name.
- Follow the requested tone and relevant retrieved guidance.
- Keep the email concise, approximately 60-120 words.
- Do not invent dates, facts, policies, prices, attachments, promises, or completed actions.
- If information is missing, use neutral wording instead of guessing.
- Return valid JSON only, with exactly these properties: subject, body, context_summary.
- subject and body must be strings. context_summary must be a concise string describing which retrieved guidance influenced the draft.
- Do not reveal private chain-of-thought or internal reasoning.`;

  // STEP 4: Call Gemini for email generation
  const generationStartedAt = Date.now();

  const data = await callGemini(config.geminiModel, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.55,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          subject: { type: 'STRING' },
          body: { type: 'STRING' },
          context_summary: { type: 'STRING' }
        },
        required: ['subject', 'body', 'context_summary']
      }
    }
  });

  const generationTimeMs = Date.now() - generationStartedAt;

  // STEP 5: Extract and validate Gemini response
  const generatedText = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!generatedText) {
    const error = new Error('The AI service returned an empty response.');
    error.statusCode = 502;
    throw error;
  }

  let email;

  try {
    email = extractJson(generatedText);
  } catch {
    const error = new Error('The AI returned an unexpected response format.');
    error.statusCode = 502;
    throw error;
  }

  if (
    typeof email.subject !== 'string' ||
    typeof email.body !== 'string' ||
    typeof email.context_summary !== 'string'
  ) {
    const error = new Error('The AI response is missing required structured fields.');
    error.statusCode = 502;
    throw error;
  }

  // STEP 6: AI-powered email quality check
  const qualityCheckStartedAt = Date.now();

  let qualityCheck = null;
  let qualityCheckTimeMs = 0;

  try {
    qualityCheck = await checkEmailQuality({
      purpose,
      recipient_name,
      tone,
      email: {
        subject: email.subject,
        body: email.body
      }
    });

    console.log(JSON.stringify({
      event: 'email_quality_check_completed',
      timestamp: new Date().toISOString(),
      qualityCheckTimeMs: Date.now() - qualityCheckStartedAt,
      overallStatus: qualityCheck.overall_status
    }));

  } catch (error) {
    console.error('Email quality check failed:', error.message);
  }

  qualityCheckTimeMs = Date.now() - qualityCheckStartedAt;

  // STEP 7: Prepare final metrics
  const totalAiTimeMs =
    retrieval.retrievalTimeMs +
    generationTimeMs +
    qualityCheckTimeMs;

  const metrics = {
    retrievalTimeMs: retrieval.retrievalTimeMs,
    generationTimeMs,
    qualityCheckTimeMs,
    totalAiTimeMs
  };

  // STEP 8: Prepare final result
  const result = {
    success: true,
    email,
    quality_check: qualityCheck,
    sources: retrieval.matches.map(({ id, title, category, score }) => ({
      id,
      title,
      category,
      relevanceScore: Number(score.toFixed(4))
    })),
    metrics,
    indexedDocumentCount: retrieval.indexedDocumentCount
  };

  // STEP 9: Store complete result in Redis
  // Also overwrites the previous cache after force refresh
  try {
    await setCachedEmail(cacheKey, result);

    console.log(JSON.stringify({
      event: 'email_cache_stored',
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Redis cache write failed:', error.message);
  }

  // STEP 10: Performance logging
  console.log(JSON.stringify({
    event: 'rag_email_generation_completed',
    timestamp: new Date().toISOString(),
    model: config.geminiModel,
    embeddingModel: config.geminiEmbeddingModel,
    retrievedChunks: retrieval.matches.length,
    cacheHit: false,
    ...metrics
  }));

  return {
    ...result,
    cache: {
      hit: false,
      source: 'gemini'
    }
  };
}


