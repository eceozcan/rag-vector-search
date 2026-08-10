import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import { clearAdminSecret, getAdminSecret, isAdminAuthenticated } from '../lib/auth';

const stats = [
  { label: 'Active projects', value: '12' },
  { label: 'Indexed docs', value: '248' },
  { label: 'Search requests', value: '1.4K' },
  { label: 'Inference time', value: '220ms' },
];

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

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/login');
      return;
    }
    setAuthChecked(true);
  }, [router]);

  const handleStartIngestion = async () => {
    setIngestStatus(null);
    setIsSubmitting(true);
    try {
      const secret = getAdminSecret();
      const response = await fetch('/api/admin/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret }),
      });
      const data = await response.json();
      if (!response.ok) {
        setIngestStatus(data?.error || 'Failed to start ingestion');
      } else {
        setIngestStatus('Embedding generation started successfully.');
      }
    } catch (error: any) {
      setIngestStatus(error?.message || 'Failed to call admin endpoint');
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    clearAdminSecret();
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
                Playable-inspired dashboard
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Build smarter search experiences with beautiful data control.
              </h1>
              <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
                A modern admin view for your RAG system: search analytics, ingestion status, document indexing, and quick access to your AI tools.
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
                {isSubmitting ? 'Starting...' : 'Ingest new corpus'}
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
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.75)]"
              >
                <dt className="text-sm font-medium text-slate-400">{stat.label}</dt>
                <dd className="mt-4 text-3xl font-semibold text-white">{stat.value}</dd>
              </div>
            ))}
          </div>
        </header>

        <main className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Latest insights</h2>
                <p className="mt-2 text-sm text-slate-400">Realtime signals from search traffic and knowledge base coverage.</p>
              </div>
              <div className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-slate-200 ring-1 ring-white/10">
                Updated now
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <p className="text-sm text-slate-400">Search success rate</p>
                <p className="mt-4 text-3xl font-semibold text-white">92%</p>
                <p className="mt-2 text-sm text-slate-500">High relevance on the latest user queries.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
                <p className="text-sm text-slate-400">Pending ingestion jobs</p>
                <p className="mt-4 text-3xl font-semibold text-white">3</p>
                <p className="mt-2 text-sm text-slate-500">Review the queued documents and trigger reindexing.</p>
              </div>
            </div>
          </section>

          <aside className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
            <div className="rounded-3xl bg-slate-950/80 p-5">
              <h3 className="text-lg font-semibold text-white">Quick actions</h3>
              <div className="mt-4 space-y-3">
                <button className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400">
                  Start new ingestion
                </button>
                <button className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-900">
                  View search logs
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950/80 p-5">
              <h3 className="text-lg font-semibold text-white">Brand vision</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Create a refined dashboard experience inspired by PlayableFactory — high contrast, smooth layouts, and intentional content sections for fast decision-making.
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
