// services/embeddingService.js

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// We ask Gemini for a smaller 768-dim fingerprint instead of its native 3072.
// Smaller = cheaper to store and faster to search. It must match the number of
// dimensions declared in your Atlas "vector_index".
const OUTPUT_DIMS = 768;

// When we shrink the vector below Gemini's native size, its length is no longer
// standardized. L2-normalization rescales it to unit length (length = 1) so that
// cosine-similarity math in Atlas stays accurate. (No-op for a zero vector.)
const normalize = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (!magnitude) return vector;
  return vector.map((v) => v / magnitude);
};

/**
 * Turn text into a meaning-fingerprint (embedding).
 *
 * @param {string} text      The text to embed.
 * @param {string} taskType  Tells Gemini HOW the vector will be used so it can
 *                           optimize it. Use "RETRIEVAL_DOCUMENT" for things you
 *                           store (jobs) and "RETRIEVAL_QUERY" for a user's
 *                           search box. Storing and searching with matching
 *                           task types is what makes retrieval accurate.
 */
export const createEmbedding = async (text, taskType = "RETRIEVAL_DOCUMENT") => {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: {
      outputDimensionality: OUTPUT_DIMS,
      taskType,
    },
  });

  return normalize(response.embeddings[0].values);
};
