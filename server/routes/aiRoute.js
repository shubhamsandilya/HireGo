import express from "express";
import {
  matchJobByProfile,
  askAboutJob,
  askAboutJobStream,
} from "../controllers/aiController.js";
import userAuth from "../middleware/auth.js";
import { rateLimiter } from "../middleware/rateLimitter.js";

const route = express.Router();

// Rate limiter sits after userAuth so it keys on the authenticated user id
// (auth.js sets req.body.user). This is the most expensive route, so keep it tight.
route.get(
  "/match-job-by-profile",
  userAuth,
  rateLimiter({ windowSec: 60, maxReq: 20, keyPrefix: "airl" }),
  matchJobByProfile
);

// RAG career assistant. POST because it carries a { jobId, question } body.
// Auth + rate limit because every call spends a Gemini request.
route.post(
  "/ask",
  userAuth,
  rateLimiter({ windowSec: 60, maxReq: 15, keyPrefix: "askrl" }),
  askAboutJob
);

// Same RAG, but streams the answer token-by-token over Server-Sent Events.
// Shares the "askrl" rate-limit bucket with /ask (both spend one Gemini call).
route.post(
  "/ask/stream",
  userAuth,
  rateLimiter({ windowSec: 60, maxReq: 15, keyPrefix: "askrl" }),
  askAboutJobStream
);

export default route;
