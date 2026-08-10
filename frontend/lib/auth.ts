const ADMIN_SECRET_KEY = 'rag-admin-secret';

export function getAdminSecret(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ADMIN_SECRET_KEY);
}

export function setAdminSecret(secret: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_SECRET_KEY, secret);
}

export function clearAdminSecret() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ADMIN_SECRET_KEY);
}

export function isAdminAuthenticated(): boolean {
  return Boolean(getAdminSecret());
}
