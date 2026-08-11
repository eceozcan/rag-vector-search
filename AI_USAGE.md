# AI Usage Log

This log records how I used AI while building this project: what I asked it to do,
what I decided and verified myself, where it was wrong or out of date, and how I caught
it. My guiding principle was to use AI as a fast pair-programmer and reviewer, but to
keep ownership of the plan and to verify every change against real behavior rather than
trusting generated code on faith.

## How I worked

1. I started from the case requirements and audited the existing code against them to
   find the real gaps, rather than adding features at random.
2. I prioritized the missing must-haves (real role-based auth, grounded answers, a real
   MCP server, live dashboard data) before any bonus, following the case guidance that a
   focused working system beats an unfinished ambitious one.
3. For each change I applied it, restarted the affected service, and tested the actual
   behavior (browser, curl, MCP Inspector) before moving on.
4. When something failed, I isolated the responsible layer (frontend, proxy, backend,
   external API) with targeted logging or request inspection instead of guessing.

## What I used AI for

- Reviewing the architecture and pointing out which requirements were not yet met.
- Scaffolding the JWT + role-based auth layer (login endpoint, token signing/verification,
  `requireAuth` / `requireAdmin` preHandlers, SQLite user store), which I then reviewed.
- Drafting the grounded-answer composer and its system prompt.
- Building the MCP `search` tool that reuses the same retrieval/grounding pipeline.
- Adding the admin stats endpoint and wiring the dashboard to real data.
- Helping reason through several integration bugs (documented below).

## What I decided and drove myself

- The plan, priorities, and scope, including deliberately deferring bonuses (OIDC,
  self-updating ingestion, deployment) to keep the core solid.
- Keeping retrieval fully local (Python sentence-transformers + cosine similarity) and
  using the LLM only for generation, with an extractive fallback so retrieval and
  citations keep working even if the LLM is unavailable — a deliberate reliability choice.
- Enforcing authorization on the server, not just in the UI, and verifying it with a
  token-less request that correctly returned 401.
- Removing the earlier admin-secret auth once JWT roles were in place, so the codebase
  has a single, clean auth path instead of two overlapping ones.

## Where AI was wrong or incomplete, and how I caught it

**Outdated Gemini model names.** AI suggested `gemini-1.5-flash`, then `gemini-2.5-flash`;
both failed for my key (2.5-flash returned a 404: "no longer available to new users").
I stopped guessing, logged the exact request URL and raw error body, listed the models
actually available to my key via the API, and switched to `gemini-flash-latest`. This one
cost me the most time until I thought to log the raw response body instead of only the
status code.

**Next.js proxy dropping the Authorization header.** Authenticated requests returned 401
even though the browser was clearly sending the token. AI assumed the Next dev rewrite
proxy would forward the header; it did not. I confirmed the header was present in the
Network tab, added temporary logging in `requireAuth` that showed `token present: false`
on the backend, and switched the frontend to call the backend directly.

**`ts-node` has no auto-reload.** Some backend edits appeared to do nothing because the
process was still on old code. Once the behavior didn't match the source, I made a
restart a required step after every backend change.

## How I verified the system

- Ran all of the case's example queries and confirmed grounded answers with correct
  citations, including the deprecated-SDK case (the answer explicitly says v2 is
  deprecated) and an out-of-corpus question (honest refusal, no invented citation).
- Tested role separation: admin can open the dashboard; a regular user has no dashboard
  link, is redirected away, and is rejected by the API directly.
- Verified the MCP server with MCP Inspector (connected, listed the `search` tool, called
  it, received a grounded answer with sources).
- Confirmed the dashboard shows real document/chunk/embedding counts, index health,
  ingestion status, and a live session search counter.

## A note on the UI

The core requirement is a responsive, readable UI with proper error handling, which is
what I focused on. On top of that I added light search-experience polish (per-source
relevance bars and simple reveal states) since the corpus belongs to a playable-ads
studio where presentation matters; it is intentionally restrained and does not change
the underlying behavior.