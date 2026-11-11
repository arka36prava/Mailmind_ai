import { knowledgeBase } from '../data/knowledgeBase.js';
import { embedText } from './geminiClient.js';

let indexedDocumentsPromise;

function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function buildIndex() {
  // Build document vectors once per server process and reuse them for later requests.
  const indexed = await Promise.all(knowledgeBase.map(async (document) => ({
    ...document,
    embedding: await embedText(`${document.title}\n${document.content}`, 'RETRIEVAL_DOCUMENT')
  })));
  return indexed;
}

export async function retrieveRelevantContext(query, topK = 3) {
  const startedAt = Date.now();
  indexedDocumentsPromise ??= buildIndex().catch((error) => {
    // Allow a later request to retry if the provider was temporarily unavailable.
    indexedDocumentsPromise = undefined;
    throw error;
  });

  const indexedDocuments = await indexedDocumentsPromise;
  const queryEmbedding = await embedText(query, 'RETRIEVAL_QUERY');
  const matches = indexedDocuments
    .map((document) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      content: document.content,
      score: cosineSimilarity(queryEmbedding, document.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    matches,
    retrievalTimeMs: Date.now() - startedAt,
    indexedDocumentCount: indexedDocuments.length
  };
}
