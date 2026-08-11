import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import { API_BASE, authHeaders, clearSession, isAdmin, isAuthenticated } from '../lib/auth';

const sections = [
  {
    title: 'Workspace overview',
    description:
      'Monitor search performance, ingestion status, and knowledge base health in a single elegant workspace.',
  },
  {
    title: 'Vector search',
    description:
      'Keep your RAG system sharp with continuous ingestion and fast similarity search across your docs.',
  },
  {
    title: 'Team readiness',
    description:
      'Review the latest metrics and access the tools your team needs to iterate on content and prompts.',
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<any | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    // Only admins may view the dashboard. Non-admins are redirected.
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

  // Loads real system + search statistics from the backend.
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
        setIngestStatus(data?.error || 'Failed to start ingestion');
      } else {
        setIngestStatus('Embedding generation started successfully.');
        // Refresh stats shortly after so new embeddings are reflected.
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

  return (
    <AppLayout
      title="Dashboard"
      description="Observe ingestion status, system health, and search analytics from an admin-first view."
    >
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="inline-flex rounded-full bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-200 ring-1 ring-violet-500/20">
                Admin dashboard
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Monitor your RAG system at a glance.
              </h1>
              <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
                A modern admin view for your RAG system: index health, ingestion status,
                document indexing, and basic search analytics.
              </p>
            </div>
            <div className="grid gap-3 sm:inline-flex sm:items-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Go to Chat
              </Link>
              <button
                type="button"
                onClick={handleStartIngestion}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 disabled:opacity-50"
              >
                {isSubmitting ? 'Starting...' : 'Generate embeddings'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-full bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Indexed documents', value: stats ? String(stats.documentCount) : '—' },
              { label: 'Chunks', value: stats ? String(stats.chunkCount) : '—' },
              { label: 'Embeddings', value: stats ? String(stats.embeddingCount) : '—' },
              { label: 'Searches this session', value: stats ? String(stats.searchCount) : '—' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.75)]"
              >
                <dt className="text-sm font-medium text-slate-400">{stat.label}</dt>
                <dd className="mt-4 text-3xl font-semibold text-white">{stat.value}</dd>
              </div>
            ))}
          </div>

          {statsError ? (
            <p className="text-sm text-red-400">Stats: {statsError}</p>
          ) : null}
        </header>

        {ingestStatus ? (
          <p className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-3 text-sm text-slate-200">
            {ingestStatus}
          </p>
        ) : null}

        <main className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">System status</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Live signals from the index and ingestion pipeline.
                </p>
              </div>
              <button
                type="button"
                onClick={loadStats}
                className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700"
              >
                Refresh
              </button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <p className="text-sm text-slate-400">Index health</p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {stats ? (stats.indexHealthy ? 'Healthy' : 'Incomplete') : '—'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {stats ? `${stats.embeddingCount}/${stats.chunkCount} chunks embedded` : 'Loading…'}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <p className="text-sm text-slate-400">Ingestion</p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {stats ? `${stats.ingestion.completed}/${stats.ingestion.total}` : '—'}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {stats && stats.ingestion.lastIngestedAt
                    ? `Last: ${new Date(stats.ingestion.lastIngestedAt).toLocaleString()}`
                    : 'documents completed'}
                </p>
              </div>
            </div>
          </section>

          <aside className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
            <div className="rounded-3xl bg-slate-950/80 p-5">
              <h3 className="text-lg font-semibold text-white">Quick actions</h3>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={handleStartIngestion}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Starting...' : 'Generate embeddings'}
                </button>
                <button
                  type="button"
                  onClick={loadStats}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900"
                >
                  Refresh stats
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950/80 p-5">
              <h3 className="text-lg font-semibold text-white">About this view</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                This dashboard is admin-only. Access is enforced on the server: a regular
                user cannot read these stats or trigger ingestion, even by calling the API directly.
              </p>
            </div>
          </aside>
        </main>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:border-violet-400/30"
            >
              <h3 className="text-xl font-semibold text-white">{section.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{section.description}</p>
            </div>
          ))}
        </section>
      </div>
    </AppLayout>
  );
}