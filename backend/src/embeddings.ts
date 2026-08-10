import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const INDEX_DIR = path.join(REPO_ROOT, 'data', 'index');
const EMB_DIR = path.join(INDEX_DIR, 'embeddings');

export type Vector = number[];

async function ensureDirs() {
  if (!fs.existsSync(INDEX_DIR)) fs.mkdirSync(INDEX_DIR, { recursive: true });
  if (!fs.existsSync(EMB_DIR)) fs.mkdirSync(EMB_DIR, { recursive: true });
}

let useModel: any = null;

async function loadUSE() {
  if (useModel) return useModel;
  try {
    // Load tfjs-node first for performance
    // Packages are optional; README will explain installation
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@tensorflow/tfjs-node');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const use = require('@tensorflow-models/universal-sentence-encoder');
    useModel = await use.load();
    return useModel;
  } catch (err) {
    throw new Error('Failed to load USE model. Install @tensorflow-models/universal-sentence-encoder and @tensorflow/tfjs-node or provide GEMINI_API_KEY');
  }
}

export async function embedWithUSE(text: string): Promise<Vector> {
  const model = await loadUSE();
  const embeddings = await model.embed([text]);
  const arr = embeddings.arraySync()[0] as number[];
  embeddings.dispose();
  return arr;
}

// Hybrid entrypoint: if GEMINI_API_KEY set and EMBEDDING_PROVIDER=gemini, use remote provider.
export async function embedTextHybrid(text: string): Promise<Vector> {
  const provider = (process.env.EMBEDDING_PROVIDER || 'auto').toLowerCase();
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const remoteUrl = process.env.EMBEDDING_API_URL;
  // If EMBEDDING_API_URL is provided, prefer it (supports local Python server).
  if (remoteUrl) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.GEMINI_API_KEY) headers.Authorization = `Bearer ${process.env.GEMINI_API_KEY}`;
    const res = await fetch(remoteUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) throw new Error(`Embedding provider returned ${res.status}`);
    const j = await res.json();
    if (Array.isArray(j?.embedding)) return j.embedding;
    if (Array.isArray(j?.data?.[0]?.embedding)) return j.data[0].embedding;
    throw new Error('Unexpected response from embedding provider');
  }

  if ((provider === 'gemini' || (provider === 'auto' && hasGemini)) && process.env.GEMINI_API_KEY) {
    // If user configures a remote embedding endpoint via GEMINI settings, call it.
    const url = process.env.EMBEDDING_API_URL || '';
    if (url) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
        body: JSON.stringify({ input: text }),
      });
      if (!res.ok) throw new Error(`Embedding provider returned ${res.status}`);
      const j = await res.json();
      if (Array.isArray(j?.embedding)) return j.embedding;
      if (Array.isArray(j?.data?.[0]?.embedding)) return j.data[0].embedding;
      throw new Error('Unexpected response from embedding provider');
    }
  }

  return embedWithUSE(text);
}

export async function ensureChunkEmbeddings() {
  await ensureDirs();
  const chunksPath = path.join(INDEX_DIR, 'chunks.json');
  if (!fs.existsSync(chunksPath)) throw new Error('No chunks.json found. Run ingestion first.');
  const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf-8')) as Array<{ id: string; text: string }>;
  const existing = new Set(fs.readdirSync(EMB_DIR).map((f) => f.replace(/\.json$/, '')));
  for (const c of chunks) {
    if (existing.has(c.id)) continue;
    try {
      const vec = await embedTextHybrid(c.text);
      fs.writeFileSync(path.join(EMB_DIR, c.id + '.json'), JSON.stringify(vec));
      console.log('Embedded chunk', c.id);
    } catch (err: any) {
      console.error('Failed embedding for', c.id, err?.message || err);
    }
  }
}

export function loadAllEmbeddings(): Record<string, Vector> {
  if (!fs.existsSync(EMB_DIR)) return {};
  const files = fs.readdirSync(EMB_DIR).filter((f) => f.endsWith('.json'));
  const out: Record<string, Vector> = {};
  for (const f of files) {
    try {
      const vec = JSON.parse(fs.readFileSync(path.join(EMB_DIR, f), 'utf-8')) as Vector;
      out[f.replace(/\.json$/, '')] = vec;
    } catch (err) {
      // ignore
    }
  }
  return out;
}
