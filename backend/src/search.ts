import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const INDEX_DIR = path.join(REPO_ROOT, 'data', 'index');

export interface Chunk {
  id: string;
  documentId: string;
  text: string;
  start?: number;
  end?: number;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
}

export interface VectorStore {
  loadChunks(): Chunk[];
  loadAllEmbeddings(): Record<string, number[]>;
  topKSearch(queryVec: number[], k?: number, minScore?: number): SearchResult[];
}

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function magnitude(a: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s);
}

export function cosine(a: number[], b: number[]) {
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

function loadChunksFromDisk(): Chunk[] {
  const p = path.join(INDEX_DIR, 'chunks.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Chunk[];
}

function loadEmbeddingsFromDisk(): Record<string, number[]> {
  const embDir = path.join(INDEX_DIR, 'embeddings');
  if (!fs.existsSync(embDir)) return {};
  const files = fs.readdirSync(embDir).filter((f) => f.endsWith('.json'));
  const out: Record<string, number[]> = {};
  for (const f of files) {
    try {
      out[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(embDir, f), 'utf-8')) as number[];
    } catch (err) {
      // ignore malformed embedding files
    }
  }
  return out;
}

class InMemoryVectorStore implements VectorStore {
  private chunks: Chunk[] = [];
  private embeddings: Record<string, number[]> = {};
  private loaded = false;

  private ensureLoaded() {
    if (this.loaded) return;
    this.chunks = loadChunksFromDisk();
    this.embeddings = loadEmbeddingsFromDisk();
    this.loaded = true;
  }

  loadChunks(): Chunk[] {
    this.ensureLoaded();
    return this.chunks;
  }

  loadAllEmbeddings(): Record<string, number[]> {
    this.ensureLoaded();
    return this.embeddings;
  }

  topKSearch(queryVec: number[], k = 5, minScore = 0.05): SearchResult[] {
    this.ensureLoaded();
    const results: SearchResult[] = [];
    for (const c of this.chunks) {
      const vec = this.embeddings[c.id];
      if (!vec) continue;
      const score = cosine(queryVec, vec);
      if (score >= minScore) results.push({ chunk: c, score });
    }
    results.sort((a, b) => b.score - a.score);
    if (results.length === 0) return [];
    if (results[0].score < minScore) return [];
    return results.slice(0, k);
  }
}

const vectorStore = new InMemoryVectorStore();

export function loadChunks(): Chunk[] {
  return vectorStore.loadChunks();
}

export function loadAllEmbeddings(): Record<string, number[]> {
  return vectorStore.loadAllEmbeddings();
}

export function topKSearch(queryVec: number[], k = 5, minScore = 0.05): SearchResult[] {
  return vectorStore.topKSearch(queryVec, k, minScore);
}
