import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { DocumentRecord, Chunk, IngestStatus } from '@shared/index';

const DEFAULT_CHUNK_CHARS = 2000; // approx for 500 tokens depending on language

function chunkText(text: string, maxChars = DEFAULT_CHUNK_CHARS): { chunks: Chunk[] } {
  const sentences = text.split(/(?<=\.|\?|!|\n)\s+/g);
  const chunks: Chunk[] = [];
  let buffer = '';
  let start = 0;
  for (const s of sentences) {
    if ((buffer + ' ' + s).length > maxChars && buffer.length > 0) {
      const id = randomUUID();
      chunks.push({ id, documentId: '', text: buffer.trim(), start, end: start + buffer.length });
      start += buffer.length;
      buffer = s;
    } else {
      buffer = buffer ? buffer + ' ' + s : s;
    }
  }
  if (buffer.length > 0) {
    const id = randomUUID();
    chunks.push({ id, documentId: '', text: buffer.trim(), start, end: start + buffer.length });
  }
  return { chunks };
}

async function ingest(corpusDir = process.argv[2] || './data/corpus') {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const dir = path.resolve(repoRoot, corpusDir);
  const outDir = path.resolve(repoRoot, 'data', 'index');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const chunkOutDir = path.join(outDir, 'chunks');
  if (!fs.existsSync(chunkOutDir)) fs.mkdirSync(chunkOutDir, { recursive: true });

  console.log('Ingesting from', dir);
  const files = fs.readdirSync(dir);

  const docs: DocumentRecord[] = [];
  const ingestStatuses: IngestStatus[] = [];
  const allChunks: Chunk[] = [];

  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    try {
      const txt = fs.readFileSync(full, 'utf-8');
      const docId = randomUUID();
      const doc: DocumentRecord = {
        id: docId,
        title: f,
        path: path.relative(repoRoot, full).replace(/\\/g, '/'),
        language: 'tr',
        ingestedAt: new Date().toISOString(),
      };
      docs.push(doc);
      ingestStatuses.push({ documentId: docId, status: 'completed', updatedAt: new Date().toISOString() });

      const { chunks } = chunkText(txt);
      for (const c of chunks) {
        c.documentId = docId;
        allChunks.push(c);
        const chunkPath = path.join(chunkOutDir, c.id + '.json');
        fs.writeFileSync(chunkPath, JSON.stringify(c, null, 2), 'utf-8');
      }

      console.log(`Indexed ${f}: ${chunks.length} chunks`);
    } catch (err: any) {
      console.error('Failed ingest', f, err?.message || err);
    }
  }

  fs.writeFileSync(path.join(outDir, 'documents.json'), JSON.stringify(docs, null, 2));
  fs.writeFileSync(path.join(outDir, 'chunks.json'), JSON.stringify(allChunks, null, 2));
  fs.writeFileSync(path.join(outDir, 'ingest-status.json'), JSON.stringify(ingestStatuses, null, 2));

  console.log('Ingestion complete. Wrote', docs.length, 'documents and', allChunks.length, 'chunks to', outDir);
}

ingest();
