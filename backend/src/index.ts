import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import dotenv from 'dotenv';
import { embedTextHybrid, ensureChunkEmbeddings, loadAllEmbeddings } from './embeddings';
import { topKSearch } from './search';
import { composeGroundedAnswer } from './compose';

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

fastify.post('/api/embeddings/generate', async (request, reply) => {
  // trigger generating embeddings for all chunks (async)
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

fastify.post('/api/search', async (request, reply) => {
  try {
    const body = request.body as any;
    const query: string = body?.query;
    const k: number = body?.k || 5;
    if (!query) return reply.status(400).send({ error: 'query required' });

    // embed query
    const qVec = await embedTextHybrid(query);
    const results = topKSearch(qVec, k, 0.01);
    const composed = composeGroundedAnswer(query, results);
    return { query, results, composed };
  } catch (err: any) {
    fastify.log.error(err);
    reply.status(500);
    return { error: err.message || String(err) };
  }
});

// MCP-like endpoint (simple): accepts { query } and returns same as /api/search
fastify.post('/mcp/search', async (request, reply) => {
  const payload = request.body as Record<string, unknown>;
  return fastify.inject({ method: 'POST', url: '/api/search', payload });
});

start();
