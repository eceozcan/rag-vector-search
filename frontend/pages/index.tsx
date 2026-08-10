import Link from 'next/link';
import { useState } from 'react';
import AppLayout from '../components/AppLayout';

export default function ChatPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setError(null);
    setAnswer(null);
    setResults(null);
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'An error occurred.');
        setLoading(false);
        return;
      }
      setAnswer(data?.composed?.answer || null);
      setResults(data?.results || null);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Request failed.');
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Chat" description="Ask questions over your indexed corpus and get grounded answers with source citations.">
      <div className="max-w-3xl mx-auto">
        <textarea
          className="w-full rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-slate-100 shadow-lg shadow-slate-950/20 placeholder:text-slate-500"
          rows={5}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your question..."
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={send}
            disabled={!query.trim() || loading}
          >
              {loading ? 'Sending...' : 'Send Question'}
          </button>
          <button
            className="bg-gray-200 px-3 py-2 rounded"
            onClick={() => { setQuery(''); setAnswer(null); setResults(null); setError(null); }}
            disabled={loading}
          >
            Clear
          </button>
        </div>
        {error ? <div className="mt-4 text-red-700">{error}</div> : null}
        {answer ? (
          <div className="mt-4 bg-white p-4 border rounded">
            <h2 className="font-semibold">Answer</h2>
            <p className="mt-2 whitespace-pre-wrap">{answer}</p>
            {results && results.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium">Sources</h3>
                <ul className="mt-2 space-y-2">
                  {results.map((r: any, i: number) => (
                    <li key={i} className="p-2 border rounded">
                      <div className="text-sm text-gray-600">score: {Number(r.score).toFixed(3)}</div>
                      <div className="mt-1 text-sm">{r.chunk?.text?.slice(0, 500)}{r.chunk?.text && r.chunk.text.length > 500 ? '…' : ''}</div>
                      <div className="mt-2 text-xs text-gray-500">chunk: {r.chunk?.id} • doc: {r.chunk?.documentId}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 bg-white p-4 border rounded text-gray-600">No answer yet.</div>
        )}
      </div>
    </AppLayout>
  );
}
