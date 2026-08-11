import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/router';
import { setSession } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      setSession(data.token, data.user.role, data.user.email);
      if (data.user.role === 'admin') {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@demo.com');
      setPassword('admin123');
    } else {
      setEmail('user@demo.com');
      setPassword('user123');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night-950 px-4 font-body text-ink">
      {/* Ambient brand glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-violet/25 blur-[120px] animate-drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-[24rem] w-[24rem] rounded-full bg-mint/20 blur-[120px] animate-drift"
        style={{ animationDelay: '3s' }}
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-night-900/70 shadow-glow backdrop-blur-xl lg:grid-cols-2">
        {/* Left: brand / hero */}
        <div className="hidden flex-col justify-between gap-8 border-r border-white/10 bg-gradient-to-br from-night-800/60 to-night-950/60 p-10 lg:flex">
          <div className="inline-flex items-center gap-2 font-display text-lg font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-mint text-sm font-bold text-night-950">
              R
            </span>
            RAG Search
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              Ask your corpus.
              <br />
              <span className="bg-gradient-to-r from-violet-soft to-mint bg-clip-text text-transparent">
                Get grounded answers.
              </span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ink-soft">
              Semantic search over your documents with citation-backed answers, an admin
              dashboard, and search exposed as an MCP tool.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-ink-faint">
            <span className="rounded-full border border-white/10 px-3 py-1">Vector search</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Grounded RAG</span>
            <span className="rounded-full border border-white/10 px-3 py-1">MCP tool</span>
          </div>
        </div>

        {/* Right: form */}
        <div className="p-8 sm:p-10">
          <h2 className="font-display text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Sign in to search the corpus. Admins can also open the dashboard.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-soft">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-night-950/70 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-violet/60 focus:ring-2 focus:ring-violet/20"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-soft">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-night-950/70 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-violet/60 focus:ring-2 focus:ring-violet/20"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-full bg-violet px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo credential quick-fill */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-night-950/50 p-4">
            <p className="text-xs font-medium text-ink-soft">Demo accounts (click to fill)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink transition hover:border-violet/40"
              >
                admin@demo.com
              </button>
              <button
                type="button"
                onClick={() => fillDemo('user')}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink transition hover:border-mint/40"
              >
                user@demo.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}