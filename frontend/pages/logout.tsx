import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../components/AppLayout';
import { clearAdminSecret } from '../lib/auth';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearAdminSecret();
    router.replace('/login');
  }, [router]);

  return (
    <AppLayout title="Logging out" description="Clearing admin credentials and redirecting to login.">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-slate-300 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <p>Logging out…</p>
      </div>
    </AppLayout>
  );
}
