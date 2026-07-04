import { GoogleGenAI, Type } from "@google/genai";
import Jobs from "../models/jobModel.js";
import Users from "../models/userModel.js";
import redis from "../config/redis.js";

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
    const cached = await redis.get(cacheKey);
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
    await redis.set(cacheKey, JSON.stringify(aiResponse), "EX", CACHE_TTL);

    return res.status(200).json({ aiResponse, cached: false });
  } catch (error) {
    console.log("AI match error:", error?.message || error);
    return res
      .status(500)
      .json({ message: "Failed to match job with profile" });
  }
};
