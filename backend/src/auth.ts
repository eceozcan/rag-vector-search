import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'dev-insecure-secret-change-me';

export type UserRole = 'user' | 'admin';

export interface AuthPayload {
  id: number;
  email: string;
  role: UserRole;
}

// Extends the Fastify request with the authenticated user, set by the preHandlers below.
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthPayload;
  }
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
  request.user = user;
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
  request.user = user;
}