import type { FastifyReply, FastifyRequest } from 'fastify';

const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim() ?? '';

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
