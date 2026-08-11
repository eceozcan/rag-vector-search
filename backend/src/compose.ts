import { SearchResult } from './search';

// Message shown when retrieval returns nothing relevant, or when the model
// determines the provided context does not answer the question.
const NO_ANSWER = 'Sorry, the corpus does not contain information on that topic.';

interface Citation {
  id: string;
  documentId: string;
  score: number;
}

interface ComposedAnswer {
  answer: string;
  citations: Citation[];
}

// Builds the citation list from retrieval results. Citations always come from
// actual retrieved chunks, never from the language model, so sources stay grounded.
function buildCitations(results: SearchResult[]): Citation[] {
  return results.map((r) => ({
    id: r.chunk.id,
    documentId: r.chunk.documentId,
    score: r.score,
  }));
}

// Fallback composer used when no LLM is configured or the LLM call fails.
// Concatenates the retrieved passages so the user still gets a grounded result.
function composeExtractive(results: SearchResult[]): ComposedAnswer {
  const topTexts = results.map((r, i) => `[#${i + 1}] ${r.chunk.text}`);
  const citations = buildCitations(results);
  const body = topTexts.join('\n\n');
  const answer = `Based on the retrieved passages:\n\n${body}`;
  return { answer, citations };
}

// System prompt that keeps the model strictly grounded in the provided context.
const SYSTEM_INSTRUCTION = [
  'You are a retrieval-augmented assistant.',
  'Answer the user question using ONLY the numbered context passages provided.',
  'Do not use outside knowledge and do not invent facts.',
  `If the passages do not contain enough information to answer, reply with exactly: "${NO_ANSWER}".`,
  'When information is deprecated or superseded, say so explicitly.',
  'Keep the answer concise and factual. Reference passages inline like [#1] when relevant.',
].join(' ');

// Calls the Gemini API to produce a grounded answer strictly from the passages.
// Returns null on any failure so the caller can fall back to extractive mode.
async function composeWithGemini(query: string, results: SearchResult[]): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = (process.env.GEMINI_MODEL || 'gemini-flash-latest').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const context = results
    .map((r, i) => `[#${i + 1}] (document ${r.chunk.documentId})\n${r.chunk.text}`)
    .join('\n\n');

  const prompt = `${SYSTEM_INSTRUCTION}\n\nContext passages:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error', res.status, errText);
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text === 'string' && text.trim().length > 0) {
      return text.trim();
    }
    return null;
  } catch (err: any) {
    console.error('Gemini API call failed:', err?.message || err);
    return null;
  }
}

// Public entrypoint. Produces a grounded answer with citations.
// Uses Gemini when configured; otherwise falls back to an extractive answer.
export async function composeGroundedAnswer(
  query: string,
  results: SearchResult[],
): Promise<ComposedAnswer> {
  if (!results || results.length === 0) {
    return { answer: NO_ANSWER, citations: [] };
  }

  const citations = buildCitations(results);

  const llmAnswer = await composeWithGemini(query, results);
  if (llmAnswer) {
    return { answer: llmAnswer, citations };
  }

  return composeExtractive(results);
}