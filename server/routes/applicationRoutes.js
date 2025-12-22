// const { Router } = require("express");
import express from "express";
import {
  getAplication,
  postApplication,
  getApplicants,
} from "../controllers/applicationController.js";
import userAuth from "../middleware/auth.js";
const route = express.Router();

// const route = express.Router();

route.post("/:id", userAuth, postApplication);
route.get("/applications", userAuth,getAplication);
route.get("/:jobId/applicants",userAuth, getApplicants);

export default route;
