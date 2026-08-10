import fs from 'fs';
import path from 'path';
import { loadAllEmbeddings } from './embeddings';

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

export function loadChunks(): Chunk[] {
  const p = path.join(INDEX_DIR, 'chunks.json');
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as Chunk[];
}

export function topKSearch(queryVec: number[], k = 5, minScore = 0.05): SearchResult[] {
  const chunks = loadChunks();
  const embeddings = loadAllEmbeddings();
  const results: SearchResult[] = [];
  for (const c of chunks) {
    const vec = embeddings[c.id];
    if (!vec) continue;
    const score = cosine(queryVec, vec);
    if (score >= minScore) results.push({ chunk: c, score });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, k);
}
