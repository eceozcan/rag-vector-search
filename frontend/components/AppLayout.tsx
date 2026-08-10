import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { isAdminAuthenticated } from '../lib/auth';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function AppLayout({ children, title, description }: AppLayoutProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(isAdminAuthenticated());
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight text-white">
              RAG Search
            </Link>
            <p className="mt-1 text-sm text-slate-400">
              Semantic search with grounded answers, citation-aware retrieval, and admin analytics.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
            >
              Chat
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Dashboard
            </Link>
            {isAdmin ? (
              <Link
                href="/logout"
                className="rounded-full bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Logout
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {title ? (
          <header className="mb-8 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            {description ? <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p> : null}
          </header>
        ) : null}
        {children}
      </main>
    </div>
  );
}
