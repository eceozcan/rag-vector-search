const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DEFAULT_CHUNK_CHARS = 2000;

function chunkText(text, maxChars = DEFAULT_CHUNK_CHARS) {
  const sentences = text.split(/(?<=\.|\?|!|\n)\s+/g);
  const chunks = [];
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

async function ingest(corpusDirArg) {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const corpusDir = corpusDirArg || '../../data/corpus';
  const dir = path.resolve(repoRoot, corpusDir);
  const outDir = path.resolve(repoRoot, 'data', 'index');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const chunkOutDir = path.join(outDir, 'chunks');
  if (!fs.existsSync(chunkOutDir)) fs.mkdirSync(chunkOutDir, { recursive: true });

  console.log('Ingesting from', dir);
  const files = fs.readdirSync(dir);

  const docs = [];
  const ingestStatuses = [];
  const allChunks = [];

  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (!stat.isFile()) continue;
    try {
      const txt = fs.readFileSync(full, 'utf-8');
      const docId = randomUUID();
      const doc = {
        id: docId,
        title: f,
        path: path.relative(repoRoot, full).replaceAll('\\', '/'),
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
    } catch (err) {
      console.error('Failed ingest', f, err && err.message ? err.message : err);
    }
  }

  fs.writeFileSync(path.join(outDir, 'documents.json'), JSON.stringify(docs, null, 2));
  fs.writeFileSync(path.join(outDir, 'chunks.json'), JSON.stringify(allChunks, null, 2));
  fs.writeFileSync(path.join(outDir, 'ingest-status.json'), JSON.stringify(ingestStatuses, null, 2));

  console.log('Ingestion complete. Wrote', docs.length, 'documents and', allChunks.length, 'chunks to', outDir);
}

const arg = process.argv[2];
ingest(arg).catch((e) => {
  console.error('Ingest failed', e && e.message ? e.message : e);
  process.exit(1);
});
