import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import { setAdminSecret } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Invalid admin secret');
        setLoading(false);
        return;
      }

      setAdminSecret(secret);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Admin login" description="Sign in to access the dashboard and protected admin operations.">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-slate-300">
              Admin secret
            </label>
            <input
              id="secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Enter admin secret"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Validating…' : 'Sign in'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
