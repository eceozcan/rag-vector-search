import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim() ?? '';
const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'dev-insecure-secret-change-me';

// ---------- Existing admin-secret layer (unchanged) ----------

export function isAdminAuthEnabled(): boolean {
  return ADMIN_SECRET.length > 0;
}

export function getAdminSecretFromRequest(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('bearer '.length).trim();
  }

  const headerSecret = request.headers['x-admin-secret'];
  if (typeof headerSecret === 'string') return headerSecret.trim();
  if (Array.isArray(headerSecret) && headerSecret.length > 0) return headerSecret[0].trim();

  return undefined;
}

export function checkAdminSecret(secret?: string): boolean {
  if (!isAdminAuthEnabled()) return true;
  return secret === ADMIN_SECRET;
}

export function requireAdminAuth(request: FastifyRequest, reply: FastifyReply) {
  const bodySecret = typeof request.body === 'object' && request.body ? (request.body as any).secret : undefined;
  const secret = getAdminSecretFromRequest(request) || bodySecret;
  if (!checkAdminSecret(secret)) {
    reply.status(401).send({ error: 'Unauthorized: admin secret required' });
  }
}

// ---------- New JWT + role-based layer ----------

export type UserRole = 'user' | 'admin';

export interface AuthPayload {
  id: number;
  email: string;
  role: UserRole;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

function getBearerToken(request: FastifyRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice('bearer '.length).trim();
  }
  return undefined;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

// Requires any authenticated user (either 'user' or 'admin').
// Used as a Fastify preHandler.
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = getBearerToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) {
    reply.status(401).send({ error: 'Unauthorized: valid login token required' });
    return;
  }
  (request as any).user = user;
}

// Requires the 'admin' role.
// Used as a Fastify preHandler.
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token = getBearerToken(request);
  const user = token ? verifyToken(token) : null;
  if (!user) {
    reply.status(401).send({ error: 'Unauthorized: valid login token required' });
    return;
  }
  if (user.role !== 'admin') {
    reply.status(403).send({ error: 'Forbidden: admin role required' });
    return;
  }
  (request as any).user = user;
}