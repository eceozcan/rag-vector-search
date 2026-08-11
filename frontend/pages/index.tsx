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
  const [asked, setAsked] = useState(false);

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
    setAsked(true);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          clearSession();
          router.replace('/login');
          return;
        }
        setError(data?.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      setAnswer(data?.composed?.answer || null);
      setResults(data?.results || null);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Request failed. Check that the backend is running.');
      setLoading(false);
    }
  };

  const clearAll = () => {
    setQuery('');
    setAnswer(null);
    setResults(null);
    setError(null);
    setAsked(false);
  };

  const examples = [
    'What is the maximum file size for an AppLovin playable?',
    'How do I initialize the current Lumen SDK?',
    'Which languages must every playable ship with?',
  ];

  if (!authChecked) {
    return null;
  }

  return (
    <AppLayout
      title="Ask the corpus"
      description="Ask a question in natural language and get a grounded answer with citations to the source documents."
    >
      <div className="mx-auto max-w-3xl">
        {/* Session bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-mint animate-pulse-ring" />
            {email ? `Signed in as ${email}` : ''}
          </span>
          <div className="flex items-center gap-4">
            {admin ? (
              <Link href="/dashboard" className="font-medium text-violet-soft transition hover:text-ink">
                Dashboard
              </Link>
            ) : null}
            <button onClick={() => { clearSession(); router.replace('/login'); }} className="transition hover:text-ink">
              Logout
            </button>
          </div>
        </div>

        {/* Query card */}
        <div className="rounded-3xl border border-white/10 bg-night-900/70 p-5 shadow-glow backdrop-blur-xl">
          <textarea
            className="w-full resize-none rounded-2xl border border-white/10 bg-night-950/70 p-4 text-ink outline-none transition placeholder:text-ink-faint focus:border-violet/60 focus:ring-2 focus:ring-violet/20"
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && query.trim() && !loading) send();
            }}
            placeholder="Ask anything about the corpus…"
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs text-ink-faint">Press ⌘/Ctrl + Enter to search</span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-white/10 disabled:opacity-40"
                onClick={clearAll}
                disabled={loading}
              >
                Clear
              </button>
              <button
                className="rounded-full bg-violet px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft disabled:opacity-40"
                onClick={send}
                disabled={!query.trim() || loading}
              >
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Example prompts (only before first ask) */}
        {!asked ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="rounded-full border border-white/10 bg-night-800/60 px-3 py-1.5 text-xs text-ink-soft transition hover:border-mint/40 hover:text-ink"
              >
                {ex}
              </button>
            ))}
          </div>
        ) : null}

        {/* Loading state */}
        {loading ? (
          <div className="mt-6 flex items-center gap-3 rounded-3xl border border-white/10 bg-night-900/60 p-6 text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-violet animate-pulse-ring" />
            <span className="h-2 w-2 rounded-full bg-violet animate-pulse-ring" style={{ animationDelay: '0.3s' }} />
            <span className="h-2 w-2 rounded-full bg-violet animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
            <span className="ml-1 text-sm">Retrieving and grounding an answer…</span>
          </div>
        ) : null}

        {/* Error state */}
        {error ? (
          <div className="mt-6 rounded-3xl border border-coral/30 bg-coral/10 p-5 text-sm text-coral">
            {error}
          </div>
        ) : null}

        {/* Answer */}
        {answer && !loading ? (
          <div className="mt-6 animate-fade-up rounded-3xl border border-white/10 bg-night-900/70 p-6 shadow-glow backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-mint/15 px-2.5 py-0.5 text-xs font-semibold text-mint ring-1 ring-mint/30">
                Grounded answer
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-ink">{answer}</p>

            {results && results.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Sources</h3>
                <ul className="mt-3 space-y-3">
                  {results.map((r: any, i: number) => {
                    const score = Number(r.score);
                    const pct = Math.max(0, Math.min(100, Math.round(score * 100)));
                    return (
                      <li
                        key={i}
                        className="animate-fade-up rounded-2xl border border-white/10 bg-night-950/60 p-4"
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-ink-soft">Relevance</span>
                          <span className="text-xs font-semibold text-mint">{score.toFixed(3)}</span>
                        </div>
                        {/* Signature element: a confidence bar per retrieved chunk */}
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet to-mint"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-ink-soft">
                          {r.chunk?.text?.slice(0, 500)}
                          {r.chunk?.text && r.chunk.text.length > 500 ? '…' : ''}
                        </p>
                        <p className="mt-2 text-xs text-ink-faint">
                          chunk {r.chunk?.id} • document {r.chunk?.documentId}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Empty state after an ask returned nothing */}
        {asked && !loading && !answer && !error ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-night-900/60 p-6 text-sm text-ink-soft">
            No grounded answer was returned for that query.
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}