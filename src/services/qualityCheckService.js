
import { config } from '../config.js';
import { callGemini } from './geminiClient.js';

function extractJson(text) {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('Invalid quality-check response from Gemini');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function checkEmailQuality({
  purpose,
  recipient_name,
  tone,
  email
}) {
  const prompt = `
You are an email quality assurance assistant.

Evaluate the following generated email against the user's original request.

USER REQUEST:
Purpose: ${purpose}
Recipient: ${recipient_name}
Requested tone: ${tone}

GENERATED EMAIL:
Subject: ${email.subject}
Body: ${email.body}

Check:
1. Grammar errors.
2. Spelling errors.
3. Clarity and readability.
4. Whether the email matches the requested purpose.
5. Whether the requested tone is maintained.
6. Whether the email contains unsupported facts or invented details.

Return ONLY valid JSON in this exact structure:

{
  "grammar": "Passed",
  "spelling": "Passed",
  "readability": "Good",
  "purpose_match": 0,
  "tone_match": 0,
  "unsupported_claims": [],
  "suggestions": [],
  "overall_status": "Passed"
}

Rules:
- purpose_match and tone_match must be integers from 0 to 100.
- Use "Needs Improvement" for grammar or spelling if errors exist.
- Use "Needs Improvement" for overall_status if meaningful corrections are required.
- Do not invent problems.
- Do not rewrite the email.
- Be strict about unsupported factual claims.
- Return only JSON, without Markdown.
`;

  const response = await callGemini(config.geminiModel, {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  });

  const responseText =
    response?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('') || '';

  const result = extractJson(responseText);

  return {
    grammar: result.grammar,
    spelling: result.spelling,
    readability: result.readability,
    purpose_match: Math.max(
      0,
      Math.min(100, Number(result.purpose_match) || 0)
    ),
    tone_match: Math.max(
      0,
      Math.min(100, Number(result.tone_match) || 0)
    ),
    unsupported_claims: Array.isArray(result.unsupported_claims)
      ? result.unsupported_claims
      : [],
    suggestions: Array.isArray(result.suggestions)
      ? result.suggestions
      : [],
    overall_status: result.overall_status
  };
}
