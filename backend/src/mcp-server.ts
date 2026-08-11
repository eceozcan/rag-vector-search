import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { embedTextHybrid } from './embeddings';
import { topKSearch } from './search';
import { composeGroundedAnswer } from './compose';

dotenv.config();

// MCP server that exposes the same retrieval capability as the HTTP API,
// so an external MCP client (e.g. Claude Desktop) can call "search" as a tool.
const server = new McpServer({
  name: 'rag-vector-search',
  version: '1.0.0',
});

server.registerTool(
  'search',
  {
    title: 'Semantic corpus search',
    description:
      'Search the indexed document corpus and return a grounded answer with the ' +
      'source passages it is based on. Returns "not in the corpus" when nothing relevant is found.',
    inputSchema: {
      query: z.string().describe('The natural-language question to search the corpus for.'),
      k: z.number().int().min(1).max(20).optional().describe('How many chunks to retrieve (default 5).'),
    },
  },
  async ({ query, k }) => {
    const safeK = typeof k === 'number' ? k : 5;

    // Reuse the exact same retrieval + grounding pipeline as the HTTP API.
    const qVec = await embedTextHybrid(query);
    const results = topKSearch(qVec, safeK, 0.25);
    const composed = await composeGroundedAnswer(query, results);

    // Return a readable answer plus structured citation data.
    const citationLines = composed.citations
      .map((c) => `- chunk ${c.id} (document ${c.documentId}) score=${c.score.toFixed(3)}`)
      .join('\n');

    const text =
      `${composed.answer}\n\n` +
      (citationLines ? `Sources:\n${citationLines}` : 'No sources.');

    return {
      content: [{ type: 'text', text }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Note: logs go to stderr so they do not corrupt the stdio MCP protocol on stdout.
  console.error('RAG MCP server running on stdio');
}

main().catch((err) => {
  console.error('MCP server failed to start:', err);
  process.exit(1);
});