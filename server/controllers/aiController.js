import { GoogleGenAI, Type } from "@google/genai";
import mongoose from "mongoose";
import Jobs from "../models/jobModel.js";
import Users from "../models/userModel.js";
import { cacheGet, cacheSetex } from "../config/redis.js";
import { createEmbedding } from "../services/embeddingService.js";

const google = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const CACHE_TTL = 60 * 60 * 6; // 6 hours

// Output shape is enforced here, so the prompt no longer needs to restate the
// format (fewer input tokens) and JSON.parse can never throw on stray markdown.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    matchScore: { type: Type.NUMBER },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
  },
  required: ["matchScore", "strengths", "missingSkills", "summary"],
  propertyOrdering: ["matchScore", "strengths", "missingSkills", "summary"],
};

// Compact prompt + minified JSON payloads keep the input token count low.
const buildPrompt = (profile, job) =>
  `You are an AI career assistant. Compare the candidate with the job and rate the fit from 0-100.
Rules: max 3 strengths, max 3 missing skills, address the reader as "you"/"your" (never "the candidate"), keep the summary short, encouraging and actionable.
CANDIDATE: ${JSON.stringify(profile)}
JOB: ${JSON.stringify(job)}`;

export const matchJobByProfile = async (req, res) => {
  try {
    const { jobId } = req.query;
    const userId = req.body.user.userId;
    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    // Serve from cache when we've already matched this user against this job.
    const cacheKey = `aimatch:${userId}:${jobId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res
        .status(200)
        .json({ aiResponse: JSON.parse(cached), cached: true });
    }

    const [job, user] = await Promise.all([
      Jobs.findById(jobId).select("jobTitle jobType experience detail"),
      Users.findById(userId).select("about skills experience jobTitle"),
    ]);
    if (!job || !user) {
      return res
        .status(404)
        .json({ message: `${!job ? "Job" : "User"} not found` });
    }

    // Don't waste a Gemini call on an empty profile — tell the client to
    // prompt the user to fill it in first.
    const hasProfile =
      Boolean(user.about) ||
      (user.skills?.length || 0) > 0 ||
      (user.experience?.length || 0) > 0;
    if (!hasProfile) {
      return res.status(200).json({ needsProfile: true });
    }

    const profile = {
      headline: user.jobTitle,
      about: user.about,
      skills: user.skills,
      experience: user.experience?.map((e) => ({
        role: e.title,
        company: e.company,
        summary: e.description,
      })),
    };
    const jobPayload = {
      title: job.jobTitle,
      type: job.jobType,
      minExperience: job.experience,
      detail: job.detail,
    };

    const response = await google.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildPrompt(profile, jobPayload),
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 600,
        // Disable the model's "thinking" pass — the biggest latency/cost win
        // for a bounded scoring task.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const aiResponse = JSON.parse(response.text);
    await cacheSetex(cacheKey, CACHE_TTL, JSON.stringify(aiResponse));

    return res.status(200).json({ aiResponse, cached: false });
  } catch (error) {
    console.log("AI match error:", error?.message || error);
    return res
      .status(500)
      .json({ message: "Failed to match job with profile" });
  }
};

// ---------------------------------------------------------------------------
// RAG: "Ask about this job" career assistant
// ---------------------------------------------------------------------------
// Retrieval-Augmented Generation, in three steps:
//   1. RETRIEVE — embed the question, vector-search the most relevant jobs.
//   2. AUGMENT  — paste those jobs into the prompt as ground-truth context.
//   3. GENERATE — Gemini answers USING ONLY that context (no guessing).
// The model was never trained on YOUR jobs, so this is what makes answers
// factual instead of made up.

const RAG_TOP_K = 5; // how many jobs to pull into the context
const RAG_MIN_SCORE = 0.7; // drop weakly-related jobs so the context stays clean

// Turn one job document into a compact, readable block for the prompt.
const formatJobForContext = (job) => {
  const detail = Array.isArray(job.detail) ? job.detail[0] : job.detail;
  return [
    `Title: ${job.jobTitle}`,
    `Company: ${job.companyName || job.company?.name || "N/A"}`,
    `Type: ${job.jobType}`,
    `Location: ${job.location}`,
    `Min experience: ${job.experience ?? 0} yrs`,
    typeof job.salary === "number" ? `Salary: ${job.salary}` : null,
    detail?.desc ? `Description: ${detail.desc}` : null,
    detail?.requirements ? `Requirements: ${detail.requirements}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

// --- Project-level knowledge -----------------------------------------------
// Small, STABLE facts about the product belong in the prompt, not a vector DB.
// This is the bot's "project-level" knowledge: how HireGo itself works.
const HIREGO_KNOWLEDGE = `HireGo is an online job portal.
- Two account types: job seekers (find & apply to jobs) and companies/recruiters (post jobs).
- Search is semantic: users can describe what they want in plain language, not just keywords.
- "AI Match" scores how well a seeker's profile fits a specific job and lists strengths and skill gaps.
- To apply: open a job and click "Apply Now"; a complete profile (photo, headline, skills, experience, resume) improves match quality.
- Companies post jobs from their dashboard; each posting becomes searchable immediately.`;

// The system instruction = the bot's role + knowledge + guardrails. Sent ONCE
// (via config.systemInstruction) and applied to every turn of the conversation.
const SYSTEM_INSTRUCTION = `You are HireGo's AI career assistant.

ABOUT HIREGO:
${HIREGO_KNOWLEDGE}

RULES:
- Help users find jobs, understand listings, and use HireGo.
- For facts, use ONLY the CONTEXT jobs and the ABOUT HIREGO info. If something isn't there, say it isn't available — never invent jobs, salaries, companies, or details.
- If asked something unrelated to jobs or HireGo (trivia, coding help, weather, etc.), politely say you can only help with jobs and the HireGo platform.
- Be concise, friendly, and address the user as "you".
- When you mention jobs, use their real title and company from the CONTEXT.`;

// --- Conversation memory ----------------------------------------------------
// How many past messages to replay to the model. Short = cheaper + faster.
const MAX_HISTORY = 8;

// Convert our {role:'user'|'assistant', content} history into Gemini's shape
// (Gemini uses 'user' and 'model'). Filter + trim defensively — the history
// comes from the client, so treat it as untrusted.
const toGeminiHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m) =>
        m &&
        typeof m.content === "string" &&
        m.content.trim() &&
        (m.role === "user" || m.role === "assistant")
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content.slice(0, 2000) }],
    }));
};

// Build the multi-turn `contents`: prior turns, then the current question with
// its freshly-retrieved job CONTEXT attached.
const buildContents = (history, contextBlock, question) => [
  ...toGeminiHistory(history),
  {
    role: "user",
    parts: [
      { text: `CONTEXT:\n${contextBlock}\n\nQUESTION: ${question.trim()}` },
    ],
  },
];

// Shared retrieval (RAG steps 1 + 2). Works BOTH ways:
//   - job page (jobId present) -> that job is always in context ("this job").
//   - homepage (no jobId)       -> pure semantic search over all jobs.
// Always returns { contextBlock, sources } — even with zero matches — so the
// model can still answer how-to / platform questions from its knowledge block.
const buildRagContext = async ({ jobId, question }) => {
  // 1) RETRIEVE — embed the question (same recipe as search), find closest jobs.
  const queryEmbedding = await createEmbedding(question, "RETRIEVAL_QUERY");
  const retrieved = await Jobs.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: RAG_TOP_K,
      },
    },
    {
      $project: {
        jobTitle: 1,
        companyName: 1,
        jobType: 1,
        location: 1,
        salary: 1,
        experience: 1,
        detail: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  // The job the user is viewing (job page only) — always include it, labelled.
  let focalJob = null;
  if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
    focalJob = await Jobs.findById(jobId).select(
      "jobTitle companyName jobType location salary experience detail"
    );
  }

  // Keep only relevant "other" jobs, and never repeat the focal job.
  const others = retrieved
    .filter((j) => j.score >= RAG_MIN_SCORE)
    .filter((j) => String(j._id) !== String(jobId));

  // 2) AUGMENT — focal job gets its own labelled section so the model can tell
  // "this job" apart from the other relevant jobs.
  const sections = [];
  if (focalJob) {
    sections.push(
      `THE JOB THE USER IS VIEWING:\n${formatJobForContext(focalJob)}`
    );
  }
  if (others.length) {
    sections.push(
      `RELEVANT JOBS:\n${others
        .map((j, i) => `(${i + 1})\n${formatJobForContext(j)}`)
        .join("\n\n")}`
    );
  }
  // Never empty: an explicit "no matches" note lets the model answer platform
  // questions instead of dead-ending.
  const contextBlock = sections.length
    ? sections.join("\n\n")
    : "(No specific job listings matched this question.)";

  // "sources" lets the UI show WHICH jobs the answer came from (trust + links).
  const sources = [focalJob, ...others].filter(Boolean).map((j) => ({
    _id: j._id,
    jobTitle: j.jobTitle,
    companyName: j.companyName,
    location: j.location,
  }));

  return { contextBlock, sources };
};

// JSON version — waits for the full answer, then returns it in one shot.
export const askAboutJob = async (req, res) => {
  try {
    const { jobId, question, history } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: "A question is required" });
    }

    const ctx = await buildRagContext({ jobId, question });

    // 3) GENERATE (blocking) — one request, one complete response.
    const response = await google.models.generateContent({
      model: "gemini-2.5-flash",
      contents: buildContents(history, ctx.contextBlock, question),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // low = factual, stays close to the given context
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return res.status(200).json({ answer: response.text, sources: ctx.sources });
  } catch (error) {
    console.log("Ask error:", error?.message || error);
    return res.status(500).json({ message: "Failed to answer the question" });
  }
};

// Streaming version — Server-Sent Events. Same RAG, but tokens are pushed to the
// browser AS Gemini generates them, so the answer "types" in real time.
export const askAboutJobStream = async (req, res) => {
  try {
    const { jobId, question, history } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: "A question is required" });
    }

    // --- Open the SSE stream ---------------------------------------------
    // These headers turn a normal HTTP response into a long-lived event stream.
    res.setHeader("Content-Type", "text/event-stream"); // "I'll send SSE events"
    res.setHeader("Cache-Control", "no-cache"); // never cache a live stream
    res.setHeader("Connection", "keep-alive"); // hold the socket open
    res.setHeader("X-Accel-Buffering", "no"); // tell Nginx NOT to buffer it
    res.flushHeaders?.(); // send headers now, don't wait for the first write

    // One SSE event = "event:" line + "data:" line + a blank line to end it.
    const send = (event, data) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

    const ctx = await buildRagContext({ jobId, question });

    // Send sources FIRST so the UI can show "based on these jobs" immediately,
    // before a single word of the answer has been generated.
    send("sources", ctx.sources);

    // If the user closes the tab mid-answer, stop burning Gemini tokens.
    let closed = false;
    req.on("close", () => {
      closed = true;
    });

    // 3) GENERATE (streaming) — this returns an async iterator of chunks.
    const stream = await google.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: buildContents(history, ctx.contextBlock, question),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    // Each loop turn is a small piece of the answer as it's produced.
    for await (const chunk of stream) {
      if (closed) break;
      const token = chunk.text;
      if (token) send("token", token);
    }

    send("done", {}); // tell the client the answer is complete
    res.end();
  } catch (error) {
    console.log("Ask stream error:", error?.message || error);
    // If we've already started streaming, we can't send a JSON error — the
    // status/headers are gone. Emit an error EVENT and close instead.
    if (res.headersSent) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: "Generation failed" })}\n\n`
      );
      return res.end();
    }
    return res.status(500).json({ message: "Failed to answer the question" });
  }
};
