import { SearchResult } from './search';

export function composeGroundedAnswer(query: string, results: SearchResult[]) {
  if (!results || results.length === 0) {
    return {
      answer: `Sorry, the corpus does not contain information on that topic.`,
      citations: [],
    };
  }

  // Simple composer: concatenate top passages and list citations.
  const topTexts = results.map((r, i) => `[#${i + 1}] ${r.chunk.text}`);
  const citations = results.map((r) => ({ id: r.chunk.id, documentId: r.chunk.documentId, score: r.score }));
  const body = topTexts.join('\n\n');

  const answer = `The following passages and sources were used to answer your question:\n\n${body}\n\nSources:\n${citations
    .map((c) => `- chunk ${c.id} (document ${c.documentId}) score=${c.score.toFixed(3)}`)
    .join('\n')}`;

  return { answer, citations };
}
