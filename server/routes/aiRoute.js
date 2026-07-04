import express from "express";
import { matchJobByProfile } from "../controllers/aiController.js";
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

export default route;
