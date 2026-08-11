import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import { API_BASE, authHeaders, clearSession, getEmail, isAdmin, isAuthenticated } from '../lib/auth';

export default function ChatPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Any authenticated user (user or admin) may access chat.
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    setAdmin(isAdmin());
    setEmail(getEmail());
    setAuthChecked(true);
  }, [router]);

  const send = async () => {
    setError(null);
    setAnswer(null);
    setResults(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If the token expired or is missing, send the user back to login.
        if (res.status === 401) {
          clearSession();
          router.replace('/login');
          return;
        }
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

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  if (!authChecked) {
    return null;
  }

  return (
    <AppLayout title="Chat" description="Ask questions over your indexed corpus and get grounded answers with source citations.">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
          <span>{email ? `Signed in as ${email}` : ''}</span>
          <div className="flex items-center gap-3">
            {admin ? (
              <Link href="/dashboard" className="text-violet-300 hover:text-violet-200">
                Dashboard
              </Link>
            ) : null}
            <button onClick={handleLogout} className="text-slate-300 hover:text-white">
              Logout
            </button>
          </div>
        </div>

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
          <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-100 shadow-lg shadow-slate-950/20">
            <h2 className="text-lg font-semibold text-white">Answer</h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-200">{answer}</p>
            {results && results.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium">Sources</h3>
                <ul className="mt-2 space-y-2">
                  {results.map((r: any, i: number) => (
                    <li key={i} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="text-sm text-slate-400">score: {Number(r.score).toFixed(3)}</div>
                      <div className="mt-1 text-sm text-slate-200">{r.chunk?.text?.slice(0, 500)}{r.chunk?.text && r.chunk.text.length > 500 ? '…' : ''}</div>
                      <div className="mt-2 text-xs text-slate-500">chunk: {r.chunk?.id} • doc: {r.chunk?.documentId}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-slate-400">No answer yet.</div>
        )}
      </div>
    </AppLayout>
  );
}