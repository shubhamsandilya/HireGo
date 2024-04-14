import express from "express";
import { getUser, updateUser } from "../controllers/userController.js";
import userAuth from "../middleware/auth.js";
const route = express.Router();
route.get("/", userAuth, getUser);
route.put("/update-user", userAuth, updateUser);

export default route;
