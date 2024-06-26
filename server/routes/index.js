import express from "express";

import authRoute from "./authRoute.js";
import userRoute from "./userRoute.js";
import companyRoute from "./companyRoute.js";
import jobRoute from "./jobRoutes.js";
import apply from "./applicationRoutes.js";

const router = express.Router();
const path = "/api/v1/";
router.use(`${path}auth`, authRoute);
router.use(`${path}users`, userRoute);
router.use(`${path}companies`, companyRoute);
router.use(`${path}jobs`, jobRoute);
router.use(`${path}apply`, apply);

export default router;
