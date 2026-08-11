import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import { API_BASE, authHeaders, clearSession, isAdmin, isAuthenticated } from '../lib/auth';

export default function Dashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<any | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (!isAdmin()) {
      router.replace('/');
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const loadStats = async () => {
    setStatsError(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { ...authHeaders() },
      });
      const data = await response.json();
      if (!response.ok) {
        setStatsError(data?.error || 'Failed to load stats');
        return;
      }
      setStats(data);
    } catch (error: any) {
      setStatsError(error?.message || 'Failed to load stats');
    }
  };

  useEffect(() => {
    if (authChecked) {
      loadStats();
    }
  }, [authChecked]);

  const handleStartIngestion = async () => {
    setIngestStatus(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/embeddings/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });
      const data = await response.json();
      if (!response.ok) {
        setIngestStatus(data?.error || 'Failed to start embedding generation');
      } else {
        setIngestStatus('Embedding generation started. Counts stay the same if the index is already complete.');
        setTimeout(loadStats, 1500);
      }
    } catch (error: any) {
      setIngestStatus(error?.message || 'Failed to call admin endpoint');
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  if (!authChecked) {
    return null;
  }

  const statCards = [
    { label: 'Indexed documents', value: stats ? String(stats.documentCount) : '—' },
    { label: 'Chunks', value: stats ? String(stats.chunkCount) : '—' },
    { label: 'Embeddings', value: stats ? String(stats.embeddingCount) : '—' },
    { label: 'Searches this session', value: stats ? String(stats.searchCount) : '—' },
  ];

  return (
    <AppLayout
      title="Dashboard"
      description="Observe index health, ingestion status, and search analytics. Admin-only, enforced on the server."
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleStartIngestion}
              disabled={isSubmitting}
              className="rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft disabled:opacity-50"
            >
              {isSubmitting ? 'Starting…' : 'Generate embeddings'}
            </button>
            <button
              type="button"
              onClick={loadStats}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white/10"
            >
              Refresh stats
            </button>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-white/10"
            >
              Go to Chat
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-ink transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>

        {ingestStatus ? (
          <p className="rounded-2xl border border-white/10 bg-night-900/60 px-5 py-3 text-sm text-ink-soft">
            {ingestStatus}
          </p>
        ) : null}
        {statsError ? (
          <p className="rounded-2xl border border-coral/30 bg-coral/10 px-5 py-3 text-sm text-coral">
            Stats: {statsError}
          </p>
        ) : null}

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-night-900/60 p-6 backdrop-blur-xl"
            >
              <dt className="text-sm font-medium text-ink-soft">{stat.label}</dt>
              <dd className="mt-4 font-display text-4xl font-semibold text-ink">{stat.value}</dd>
            </div>
          ))}
        </div>

        {/* System status */}
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-white/10 bg-night-900/60 p-6 backdrop-blur-xl lg:col-span-2">
            <h2 className="font-display text-xl font-semibold text-ink">System status</h2>
            <p className="mt-1 text-sm text-ink-soft">Live signals from the index and ingestion pipeline.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-night-950/60 p-5">
                <p className="text-sm text-ink-soft">Index health</p>
                <p className="mt-2 flex items-center gap-2 font-display text-2xl font-semibold text-ink">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      stats ? (stats.indexHealthy ? 'bg-mint' : 'bg-coral') : 'bg-ink-faint'
                    }`}
                  />
                  {stats ? (stats.indexHealthy ? 'Healthy' : 'Incomplete') : '—'}
                </p>
                <p className="mt-2 text-sm text-ink-faint">
                  {stats ? `${stats.embeddingCount}/${stats.chunkCount} chunks embedded` : 'Loading…'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-night-950/60 p-5">
                <p className="text-sm text-ink-soft">Ingestion</p>
                <p className="mt-2 font-display text-2xl font-semibold text-ink">
                  {stats ? `${stats.ingestion.completed}/${stats.ingestion.total}` : '—'}
                </p>
                <p className="mt-2 text-sm text-ink-faint">
                  {stats && stats.ingestion.lastIngestedAt
                    ? `Last: ${new Date(stats.ingestion.lastIngestedAt).toLocaleString()}`
                    : 'documents completed'}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-night-900/60 p-6 backdrop-blur-xl">
            <h3 className="font-display text-lg font-semibold text-ink">About this view</h3>
            <p className="mt-3 text-sm leading-6 text-ink-soft">
              This dashboard is admin-only. Access is enforced on the server: a regular user
              cannot read these stats or trigger ingestion, even by calling the API directly.
            </p>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}