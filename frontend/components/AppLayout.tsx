import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearSession, isAdmin as checkIsAdmin, isAuthenticated } from '../lib/auth';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function AppLayout({ children, title, description }: AppLayoutProps) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    // Read auth state on the client after mount to avoid SSR/localStorage issues.
    setAuthed(isAuthenticated());
    setAdmin(checkIsAdmin());
  }, [router.pathname]);

  const handleLogout = () => {
    clearSession();
    router.replace('/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-night-950 font-body text-ink">
      {/* Ambient background: two soft, slowly drifting brand-colored glows. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-violet/20 blur-[120px] animate-drift"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-mint/15 blur-[120px] animate-drift"
        style={{ animationDelay: '3s' }}
      />

      {/* Top navigation */}
      <div className="relative border-b border-white/10 bg-night-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet to-mint text-xs font-bold text-night-950">
                R
              </span>
              RAG Search
            </Link>
            <p className="mt-1 text-sm text-ink-soft">
              Semantic search with grounded, citation-backed answers.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-ink transition hover:bg-white/10"
            >
              Chat
            </Link>

            {/* Dashboard link is only shown to admins. */}
            {admin ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-violet px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft"
              >
                Dashboard
              </Link>
            ) : null}

            {/* Show Logout when signed in, otherwise a Sign in link. */}
            {authed ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-ink transition hover:bg-white/10"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-ink transition hover:bg-white/10"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {title ? (
          <header className="mb-8">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">{description}</p>
            ) : null}
          </header>
        ) : null}
        {children}
      </main>
    </div>
  );
}