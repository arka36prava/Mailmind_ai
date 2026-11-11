import { config } from '../config.js';

export async function callGemini(model, payload, timeoutMs = 30000) {
  if (!config.geminiApiKey) {
    const error = new Error('AI service is not configured. Add GEMINI_API_KEY to your .env file.');
    error.statusCode = 503;
    throw error;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (cause) {
    const error = new Error('Could not reach the Gemini API. Please try again later.');
    error.statusCode = 502;
    error.cause = cause;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Gemini API error:', data.error?.message || response.statusText);
    const error = new Error('The AI provider could not complete the request. Check your API key, quota, and model configuration.');
    error.statusCode = response.status === 429 ? 503 : 502;
    throw error;
  }

  return data;
}

export async function embedText(text, taskType) {
  if (!config.geminiApiKey) {
    const error = new Error('AI service is not configured. Add GEMINI_API_KEY to your .env file.');
    error.statusCode = 503;
    throw error;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiEmbeddingModel}:embedContent?key=${config.geminiApiKey}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${config.geminiEmbeddingModel}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: 768
      }),
      signal: AbortSignal.timeout(20000)
    });
  } catch (cause) {
    const error = new Error('Could not reach the Gemini embedding service.');
    error.statusCode = 502;
    error.cause = cause;
    throw error;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Gemini embedding error:', data.error?.message || response.statusText);
    const error = new Error('Could not create semantic embeddings. Check the embedding model and API quota.');
    error.statusCode = response.status === 429 ? 503 : 502;
    throw error;
  }

  const values = data.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    const error = new Error('The embedding service returned an invalid vector.');
    error.statusCode = 502;
    throw error;
  }
  return values;
}
