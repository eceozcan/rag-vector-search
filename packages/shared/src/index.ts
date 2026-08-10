export interface DocumentRecord {
  id: string;
  title: string;
  path: string;
  language?: string;
  ingestedAt?: string | null;
}

export interface Chunk {
  id: string;
  documentId: string;
  text: string;
  start?: number;
  end?: number;
}

export interface IngestStatus {
  documentId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message?: string;
  updatedAt: string;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
}
