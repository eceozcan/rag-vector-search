import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { embedTextHybrid, ensureChunkEmbeddings } from './embeddings';
import { topKSearch } from './search';
import { composeGroundedAnswer } from './compose';
import {
  checkAdminSecret,
  getAdminSecretFromRequest,
  isAdminAuthEnabled,
  signToken,
  requireAuth,
  requireAdmin,
} from './auth';
import { getUserByEmail } from './db';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

const start = async () => {
  try {
    await fastify.register(fastifyCors, {
      origin: true,
    });

    await fastify.listen({ port: Number(process.env.PORT || 4000), host: '0.0.0.0' });
    fastify.log.info('Server started');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// ---------- Auth: login ----------
// Accepts { email, password }, verifies against the users table,
// and returns a signed JWT plus the user's public profile.
fastify.post('/api/auth/login', async (request, reply) => {
  const body = request.body as any;
  const email: string = body?.email;
  const password: string = body?.password;

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return reply.status(400).send({ error: 'email and password are required' });
  }

  const user = getUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return reply.status(401).send({ error: 'Invalid email or password' });
  }

  const passwordOk = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordOk) {
    return reply.status(401).send({ error: 'Invalid email or password' });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
});

// Returns the current authenticated user's profile (used by the frontend to
// confirm a stored token is still valid and to read the role).
fastify.get('/api/auth/me', { preHandler: requireAuth }, async (request) => {
  return { user: (request as any).user };
});

// ---------- Admin: legacy secret verify (kept for backward compatibility) ----------
fastify.post('/api/admin/verify', async (request, reply) => {
  const secret = getAdminSecretFromRequest(request) || (request.body as any)?.secret;
  if (!checkAdminSecret(secret)) {
    return reply.status(401).send({ error: 'Unauthorized: invalid admin secret' });
  }
  return { ok: true, adminAuthEnabled: isAdminAuthEnabled() };
});

// ---------- Admin: trigger embedding generation (admin role required) ----------
fastify.post('/api/embeddings/generate', { preHandler: requireAdmin }, async (request, reply) => {
  try {
    ensureChunkEmbeddings()
      .then(() => fastify.log.info('Embeddings generation finished'))
      .catch((e) => fastify.log.error('Embeddings generation failed', e?.message || e));
    return { status: 'started' };
  } catch (err: any) {
    reply.status(500);
    return { error: err.message || String(err) };
  }
});

// ---------- Search (any authenticated user) ----------
fastify.post('/api/search', { preHandler: requireAuth }, async (request, reply) => {
  try {
    const body = request.body as any;
    const query: string = body?.query;
    const k: number = body?.k || 5;
    if (!query) return reply.status(400).send({ error: 'query required' });
    if (typeof query !== 'string' || query.trim().length === 0) {
      return reply.status(400).send({ error: 'query must be a non-empty string' });
    }
    const safeK = Number.isFinite(k) && k > 0 && k <= 20 ? Math.floor(k) : 5;

    // Embed the query, retrieve the top matching chunks, and compose an answer.
    const qVec = await embedTextHybrid(query);
    const results = topKSearch(qVec, safeK, 0.25);
    const composed = await composeGroundedAnswer(query, results);
    return { query, results, composed, source: 'backend-english-v1' };
  } catch (err: any) {
    fastify.log.error(err);
    reply.status(500);
    return { error: err.message || String(err) };
  }
});

// MCP-like HTTP endpoint (simple): accepts { query } and returns same as /api/search.
// The real MCP server lives in mcp-server.ts.
fastify.post('/mcp/search', async (request, reply) => {
  const payload = request.body as Record<string, unknown>;
  return fastify.inject({ method: 'POST', url: '/api/search', payload });
});

start();