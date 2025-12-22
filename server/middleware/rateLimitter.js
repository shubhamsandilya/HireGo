import redis from "../config/redis.js ";

export const rateLimiter = ({
  windowSec = 60,
  maxReq = 30,
  keyPrefix = "rl",
}) => {
  return async (req, res, next) => {
    try {
      const identifier =
        req.user?.userId || req.ip; // user-based after auth, IP-based before

      const key = `${keyPrefix}:${identifier}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      if (current > maxReq) {
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
        });
      }

      next();
    } catch (err) {
      console.error("Rate limit error:", err.message);
      next(); // fail open
    }
  };
};
