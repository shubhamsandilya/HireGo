import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

// Delete every key matching one or more glob patterns (e.g. "jobs:*").
// ioredis `del` does NOT expand globs, so we SCAN for the matching keys first.
export const clearCache = async (...patterns) => {
  for (const pattern of patterns) {
    const stream = redis.scanStream({ match: pattern, count: 100 });
    for await (const keys of stream) {
      if (keys.length) await redis.del(...keys);
    }
  }
};

export default redis;
