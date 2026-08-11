// Stores the login token and the authenticated user's role in localStorage.
// The token is a JWT issued by the backend at POST /api/auth/login.
// Backend base URL. All API calls go directly to the backend.

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

const TOKEN_KEY = 'rag-auth-token';
const ROLE_KEY = 'rag-auth-role';
const EMAIL_KEY = 'rag-auth-email';

export type UserRole = 'user' | 'admin';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  return (window.localStorage.getItem(ROLE_KEY) as UserRole) || null;
}

export function getEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(EMAIL_KEY);
}

// Persists the session after a successful login.
export function setSession(token: string, role: UserRole, email: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(ROLE_KEY, role);
  window.localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(EMAIL_KEY);
}

// True if any user is logged in (either 'user' or 'admin').
export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

// True only for admin users. Used to gate the dashboard.
export function isAdmin(): boolean {
  return getRole() === 'admin';
}

// Builds the Authorization header for authenticated backend requests.
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}