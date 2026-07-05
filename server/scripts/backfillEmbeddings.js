// Backfill: generate embeddings for jobs.
//
// Usage:
//   cd server && npm run backfill:embeddings            # only jobs missing an embedding
//   cd server && npm run backfill:embeddings -- --force # RE-embed EVERY job
//
// Default is safe to re-run — it only touches jobs whose `embedding` is
// missing/empty. Use --force after changing the embedding recipe (task type,
// dimensions, or the text template) so every job is re-embedded consistently.

import "dotenv/config";
import mongoose from "mongoose";
import Jobs from "../models/jobModel.js";
import { createEmbedding } from "../services/embeddingService.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  if (!process.env.MONGODB_URL) throw new Error("MONGODB_URL is not set");
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  // --force re-embeds every job; without it we only fill in the gaps.
  const force = process.argv.includes("--force");

  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected to MongoDB");

  // {} selects ALL jobs; otherwise only those with a missing/empty embedding.
  const filter = force
    ? {}
    : { $or: [{ embedding: { $exists: false } }, { embedding: { $size: 0 } }] };

  const jobs = await Jobs.find(filter).select("jobTitle detail embedding");

  console.log(
    force
      ? `--force: re-embedding all ${jobs.length} job(s).`
      : `Found ${jobs.length} job(s) without embeddings.`
  );

  let done = 0;
  let failed = 0;

  for (const job of jobs) {
    // Build the SAME text used at job-creation time, so query and document
    // embeddings stay comparable.
    const detail = Array.isArray(job.detail) ? job.detail[0] : job.detail;
    const text = [job.jobTitle, detail?.desc, detail?.requirements]
      .filter(Boolean)
      .join(" ")
      .trim();

    try {
      // "RETRIEVAL_DOCUMENT" — these are stored job vectors, matching createJob.
      const embedding = await createEmbedding(
        text || job.jobTitle || "job",
        "RETRIEVAL_DOCUMENT"
      );
      // updateOne with $set avoids re-running model hooks and touches only the vector.
      await Jobs.updateOne({ _id: job._id }, { $set: { embedding } });
      done += 1;
      console.log(`(${done + failed}/${jobs.length}) embedded: ${job.jobTitle}`);
    } catch (err) {
      failed += 1;
      console.log(`(${done + failed}/${jobs.length}) FAILED ${job._id}: ${err?.message}`);
    }

    // Gentle pause to stay under Gemini rate limits.
    await sleep(300);
  }

  console.log(`\nDone. Embedded ${done}, failed ${failed}, total ${jobs.length}.`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error("Backfill failed:", err?.message || err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
