import Redis from "ioredis";

// Fail a command fast (→ cache miss) instead of hanging when Redis is down, and
// don't queue commands while disconnected. This is what keeps a missing Redis
// from blocking requests.
const commonOpts = {
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
};

// Prefer a full connection URL — managed providers (Upstash, Render Key Value,
// Redis Cloud) hand you one. Fall back to host/port for local development.
const REDIS_URL = process.env.REDIS_URL;

// Managed Redis requires TLS. Enable it for `rediss://` URLs, and ALSO when the
// host is Upstash even if the URL was pasted as plain `redis://` — Upstash's CLI
// snippet uses `redis:// + --tls`, so dropping the flag is an easy mistake that
// otherwise causes a connect → ECONNRESET → reconnect loop.
const needsTls =
  !!REDIS_URL &&
  (REDIS_URL.startsWith("rediss://") || /upstash\.io/i.test(REDIS_URL));

const redis = REDIS_URL
  ? new Redis(REDIS_URL, {
      ...commonOpts,
      tls: needsTls ? { rejectUnauthorized: false } : undefined,
    })
  : new Redis({
      ...commonOpts,
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
    });

// Log connection state changes ONCE (on transition), not on every retry, so a
// missing/broken Redis doesn't flood the deploy logs.
let down = false;
redis.on("connect", () => {
  console.log(down ? "Redis reconnected" : "Redis connected");
  down = false;
});
redis.on("error", (err) => {
  if (!down) {
    console.error(
      "Redis unavailable — caching & rate-limiting will be skipped:",
      err.message
    );
    down = true;
  }
});

// --- Safe cache helpers -----------------------------------------------------
// A Redis outage must never break a request: reads return null (cache miss),
// writes and invalidations become no-ops.
export const cacheGet = async (key) => {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
};

export const cacheSetex = async (key, ttlSeconds, value) => {
  try {
    await redis.setex(key, ttlSeconds, value);
  } catch {
    /* best-effort cache write */
  }
};

// Delete every key matching one or more glob patterns (e.g. "jobs:*").
// ioredis `del` does NOT expand globs, so we SCAN for the matching keys first.
export const clearCache = async (...patterns) => {
  try {
    for (const pattern of patterns) {
      const stream = redis.scanStream({ match: pattern, count: 100 });
      for await (const keys of stream) {
        if (keys.length) await redis.del(...keys);
      }
    }
  } catch {
    /* best-effort cache invalidation */
  }
};

export default redis;
