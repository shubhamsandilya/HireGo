# HireGo → GenAI Learning Roadmap (Free, Node/JS)

A practical plan to learn the most in-demand GenAI skills — **RAG, embeddings, vector DB, tool-use/agents, and MCP** — by adding real features to *this* job portal. Built for your profile: a **full-stack MERN developer**. You stay in Node/JS the whole way.

> **Goal:** learn by building. Every feature below maps to a skill recruiters ask for, costs **₹0 / $0**, and needs **no new disk-heavy installs**.

---

## 1. The big idea

You already know MERN. GenAI is just **a few new "Lego bricks"** you snap onto the stack you have:

| New brick                  | One-line meaning                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------- |
| **LLM**              | A text brain you call over HTTP (like any API).                                    |
| **Embedding**        | Turn text into a list of numbers that captures its*meaning*.                     |
| **Vector DB**        | A database that finds items with*similar meaning* (not just matching keywords).  |
| **RAG**              | "Look up real facts first, then let the LLM answer using them."                    |
| **Tool use / Agent** | Let the LLM call*your* functions (search jobs, send email…) to get things done. |
| **MCP**              | A standard plug so any AI app (e.g. Claude Desktop) can use your app's tools.      |

"AI-powered full-stack" = MERN + these bricks. That's the in-demand profile.

---

## 2. Your $0 stack (no card, no subscription, no heavy install)

| Need                          | Free tool                                                            | Why it's free / light                                                | Disk      |
| ----------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | --------- |
| **LLM (chat/generate)** | **Google Gemini API** (free tier) or **Groq** (free)     | Free API key,**no credit card**. Generous limits for learning. | 0 (cloud) |
| **Embeddings**          | **Transformers.js** (`@xenova/transformers`) — runs in Node | No API, no key, fully offline, model ~25 MB                          | ~25 MB    |
| (or embeddings)               | **Gemini `text-embedding-004`**                              | Free, no card, no local model                                        | 0 (cloud) |
| **Vector DB**           | **MongoDB Atlas Vector Search** (free **M0**)            | You already use Atlas — DB*is* the vector store                   | 0 (cloud) |
| **MCP**                 | `@modelcontextprotocol/sdk` + **Claude Desktop** (free app)  | Protocol SDK is open-source; desktop app is free                     | small     |
| **App**                 | Your existing MERN (React, Express, Mongo, Redis)                    | Already built                                                        | 0         |

**5-minute setup**

1. Get a free Gemini key → `aistudio.google.com` → "Get API key" (no card). Put it in `server/.env` as `GEMINI_API_KEY=...`.
2. (Embeddings local option) `cd server && npm i @xenova/transformers`.
3. Atlas: resume your free cluster, then later enable a **Vector Search index** (UI, free on M0).

> **Why not Claude/OpenAI now?** They're excellent but **paid** (no free tier). Learn for free on Gemini/Groq — **the code patterns are identical**, so you can switch to Claude later by changing ~5 lines. See §8 for when to upgrade.

---

## 3. Concepts in plain English (with a tiny example)

**Embedding** — text → numbers that capture meaning. "React dev" and "frontend engineer" land *close together*.

```js
// Local, free, offline (Transformers.js)
import { pipeline } from '@xenova/transformers';
const embed = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const out = await embed('React developer', { pooling: 'mean', normalize: true });
const vector = Array.from(out.data); // → 384 numbers
```

**Vector DB / semantic search** — store those vectors, then ask "what's *closest in meaning*?" A search for "frontend ninja" finds "React engineer" even with **zero shared words**. (Keyword search can't do that — your current job search uses regex.)

**RAG (Retrieval-Augmented Generation)** — the #1 job skill. Steps: **(1)** embed the user's question, **(2)** vector-search your real data for the top matches, **(3)** paste those into the LLM prompt, **(4)** LLM answers *grounded in your data* (no hallucinations).

> Analogy: open-book exam. The LLM doesn't memorize — it reads your book (DB) first.

**Chunking** — long text (a CV, a long JD) is split into small pieces before embedding, so retrieval is precise. Rule of thumb: ~200–500 words per chunk.

**Prompt engineering** — clear instructions + examples = better output. "You are a hiring assistant. Use ONLY the jobs below. If none fit, say so."

**Structured output (JSON)** — force the LLM to return clean JSON your code can use directly (e.g. `{ "matchScore": 82, "reasons": [...] }`) instead of a paragraph.

**Tool use / Function calling / Agents** — you describe functions (e.g. `searchJobs(query)`); the LLM decides *when* to call them, you run them, feed results back, it continues. An **agent** = LLM in a loop with tools until the task is done.

**MCP (Model Context Protocol)** — a universal adapter. Wrap your HireGo features as MCP "tools"; then **Claude Desktop or any MCP client can use them** ("find me React jobs in Delhi"). Hot, new, very in-demand.

**Evals** — measure if your AI output is actually good (e.g. does the match score make sense on 20 test resumes). Separates hobby from production.

---

## 4. Features to build in HireGo (easy → hard)

Each feature = one skill. Build in this order.

### F1 — AI Job-Match Score & explanation ⭐ *start here*

**Teaches:** prompting + **structured JSON output**.
**What:** on a job detail page, show "You're an 82% match" + 3 reasons, by comparing the user's profile/CV text to the job.
**How:** send profile + JD to the LLM, ask for JSON.

```js
const prompt = `You are a hiring assistant. Compare the CANDIDATE to the JOB.
Return ONLY JSON: {"matchScore": <0-100>, "reasons": [3 short strings], "gaps": [..]}.
CANDIDATE: ${profileText}
JOB: ${jobText}`;
// call Gemini → JSON.parse(response) → render in React
```

**Plugs into:** `JobDetail.jsx`, a new `POST /api/v1/ai/match`.

### F2 — Semantic Job Search 🔢

**Teaches:** **embeddings + vector DB** (the core skill).
**What:** a search box that understands meaning. "build websites" → finds "Frontend Developer".
**How:** (1) when a job is created, embed its text → store `embedding` field on the Job. (2) On search, embed the query and run Atlas `$vectorSearch`. (See cookbook §7.)
**Plugs into:** extend `jobController.getJobPosts`, add an `embedding` field to `jobModel`.

### F3 — "Ask about this job" / Career Assistant 💬 ⭐ *the flagship*

**Teaches:** **RAG** end-to-end + streaming.
**What:** a chat box: "Does this role need AWS? What salary? Suggest similar roles." Answers using only real DB data.
**How:** embed question → `$vectorSearch` top jobs → stuff into prompt → stream the answer.
**Plugs into:** new `Chat` component + `POST /api/v1/ai/ask` (use streaming — see §7).

### F4 — AI Cover Letter / JD Generator ✍️

**Teaches:** generation + **streaming** UX.
**What:** "Generate a cover letter for this job" (seeker) or "Write a job description from these bullets" (recruiter).
**How:** templated prompt → stream tokens to the UI (feels fast/live).
**Plugs into:** buttons on `Apply.jsx` / `UploadJobs.jsx`.

### F5 — Job Recommendations ("More like this") 🎯

**Teaches:** vector **similarity / recommendation**.
**What:** "Recommended for you" using the seeker's profile/history vector vs job vectors. Reuses F2's embeddings.
**Plugs into:** `FindJobs.jsx` home strip.

### F6 — Agentic Application Assistant 🤖

**Teaches:** **tool use / agents**.
**What:** "Find 3 React jobs in Delhi under 5 yrs exp and draft applications." The LLM calls your tools: `searchJobs`, `getProfile`, `draftCoverLetter`.
**How:** define tools → LLM picks them → you execute → loop until done (cookbook §7).
**Plugs into:** new `agentController`.

### F7 — MCP Server for HireGo 🔌 *(cutting-edge, résumé gold)*

**Teaches:** **MCP**.
**What:** expose `search_jobs`, `get_job`, `list_applications` as MCP tools; connect to **Claude Desktop** and query your app in natural language.
**Plugs into:** standalone `mcp/` server reusing your Mongoose models (cookbook §7).

> Optional **F8 — Evals:** a script scoring F1/F3 outputs against 15–20 hand-labeled examples. Shows production maturity.

---

## 5. Parallel learn-while-building plan (~6 weeks, ~1 hr/day)

| Week | Learn (concept)                        | Build (feature)                               | You can now say…                                |
| ---- | -------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| 1    | LLM API basics, prompting, JSON output | **F1** Match score                      | "I integrated an LLM with structured output."    |
| 2    | Embeddings + vector search             | **F2** Semantic search                  | "I built semantic search with a vector DB."      |
| 3    | RAG, chunking                          | **F3** Career chat (RAG)                | "I shipped a RAG chatbot over real data."        |
| 4    | Streaming, prompt templates            | **F4** + **F5** Generation + recs | "I built streaming GenAI UX + recommendations."  |
| 5    | Tool use / agents                      | **F6** Agent                            | "I built an AI agent with tool calling."         |
| 6    | MCP (+ optional evals)                 | **F7** MCP server                       | "I built an MCP server exposing my app's tools." |

**Method that works:** for each week — (a) 30 min concept (read/watch), (b) build the feature, (c) write 5 lines in a `notes.md` on *why it worked*. Building cements it far better than only watching.

---

## 6. Minimal code cookbook (copy-paste starters)

**Embed text (free, local):**

```js
import { pipeline } from '@xenova/transformers';
let embedder;
export async function embed(text) {
  embedder ??= await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const out = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data); // 384-dim vector
}
```

**Atlas Vector Search index** (create once in Atlas UI → *Atlas Search → Create Index → JSON editor*, on your `jobs` collection):

```json
{ "fields": [
  { "type": "vector", "path": "embedding", "numDimensions": 384, "similarity": "cosine" }
]}
```

**Semantic search query (Mongoose aggregation):**

```js
const queryVec = await embed(req.query.search);
const jobs = await Jobs.aggregate([
  { $vectorSearch: {
      index: 'job_vector_index', path: 'embedding',
      queryVector: queryVec, numCandidates: 100, limit: 5 } }
]);
```

**Call the LLM (Gemini free):**

```js
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // free tier
const r = await model.generateContent(prompt);
console.log(r.response.text());
```

**RAG in 4 lines (the whole skill):**

```js
const ctxJobs = await semanticSearch(question);                 // 1. retrieve
const context = ctxJobs.map(j => j.jobTitle + ': ' + j.detail.desc).join('\n');
const prompt = `Answer using ONLY these jobs:\n${context}\n\nQ: ${question}`; // 2. augment
const answer = (await model.generateContent(prompt)).response.text();        // 3-4. generate
```

**Tool use loop (concept):** describe tools → LLM returns a tool call → you run it → send result back → repeat until it answers. (Gemini & Claude both support "function calling"; same shape.)

**MCP server skeleton:**

```js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
const server = new McpServer({ name: 'hirego', version: '1.0.0' });
server.tool('search_jobs', { query: z.string() }, async ({ query }) => {
  const jobs = await semanticSearch(query);
  return { content: [{ type: 'text', text: JSON.stringify(jobs) }] };
});
await server.connect(new StdioServerTransport());
// Then add this server to Claude Desktop's config and ask it to "search jobs".
```

*(Check each library's current README for exact signatures — APIs drift.)*

---

## 7. When you're ready for production: Claude (paid, best-in-class)

Once you've learned for free, swapping to Claude is a few lines. Claude has **no free tier** (pay-per-token), so use it when a project is real. Current models and when to use each:

| Model             | ID                    | Use it for                                                                    |
| ----------------- | --------------------- | ----------------------------------------------------------------------------- |
| Claude Haiku 4.5  | `claude-haiku-4-5`  | Cheapest/fastest — high-volume, simple tasks (match scores, classification). |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | Balanced default — most chat/RAG/generation.                                 |
| Claude Opus 4.8   | `claude-opus-4-8`   | Hardest reasoning, agents, long tasks.                                        |
| Claude Fable 5    | `claude-fable-5`    | Most capable, most expensive — frontier work only.                           |

```js
// npm i @anthropic-ai/sdk ; ANTHROPIC_API_KEY in env
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
const msg = await client.messages.create({
  model: 'claude-sonnet-4-6', max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
});
console.log(msg.content[0].text);
```

For embeddings with Claude, Anthropic recommends **Voyage AI** (`voyage-3`, has a free tier) — Anthropic has no embeddings model of its own.

---

## 8. Free places to learn each concept

- **Prompting / LLM basics** — Google AI Studio docs; "Prompt Engineering Guide" (promptingguide.ai).
- **Embeddings & vector search** — MongoDB Atlas Vector Search tutorials (free, match your DB).
- **RAG** — search "RAG from scratch" (many free Node walkthroughs); LangChain.js docs (optional).
- **Tool use / agents** — Gemini & Anthropic "function calling" docs.
- **MCP** — `modelcontextprotocol.io` (official, free).
- **Transformers.js** — Xenova/transformers.js GitHub README.

---

## 9. Tips & common traps

- **Start tiny.** Get F1 returning JSON before anything fancy. Momentum > perfection.
- **Embed once, reuse.** Compute job embeddings on create/update (you already cache jobs — same hook). Don't re-embed on every search.
- **Same model for index & query.** If jobs are embedded with `all-MiniLM-L6-v2` (384-dim), the search query must use the *same* model. Mixing models breaks search.
- **Free-tier limits.** Gemini free has rate limits — fine for dev; add a tiny retry. Your existing Redis rate-limiter helps.
- **Keep secrets in `server/.env`** (already gitignored). Never hardcode keys.
- **RAG rule:** always tell the LLM "use ONLY the provided data; if unsure, say so" — kills hallucinations.
- **Show it off.** Each feature is a portfolio/LinkedIn post. F2, F3, F6, F7 are the résumé headliners.

---

*Build order recap: **F1 → F2 → F3 → F4/F5 → F6 → F7**. One brick at a time, all free.*
