import { SearchResult } from './search';

export function composeGroundedAnswer(query: string, results: SearchResult[]) {
  if (!results || results.length === 0) {
    return {
      answer: `Üzgünüm, elimizde bu konuda bilgi bulunmamaktadır.`,
      citations: [],
    };
  }

  // Simple composer: concatenate top passages and list citations.
  const topTexts = results.map((r, i) => `[#${i + 1}] ${r.chunk.text}`);
  const citations = results.map((r) => ({ id: r.chunk.id, documentId: r.chunk.documentId, score: r.score }));
  const body = topTexts.join('\n\n');

  const answer = `Aşağıda ilgili pasajlar ve kaynakları bulunmaktadır:\n\n${body}\n\nKaynaklar:\n${citations
    .map((c) => `- chunk ${c.id} (document ${c.documentId}) score=${c.score.toFixed(3)}`)
    .join('\n')}`;

  return { answer, citations };
}
