// const { Router } = require("express");
import express from "express";
import  {  matchJobByProfile} from "../controllers/aiController.js";
import userAuth from "../middleware/auth.js";
const route = express.Router();

// const route = express.Router();

route.post("/match-profile-by-jd",userAuth, matchJobByProfile);

export default route;
