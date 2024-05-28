// const { Router } = require("express");
import express from "express";
import {
  getAplication,
  postApplication,
} from "../controllers/applicationController.js";
import userAuth from "../middleware/auth.js";
const route = express.Router();

// const route = express.Router();

route.post("/:id", postApplication);
route.get("/applications", getAplication);

export default route;
