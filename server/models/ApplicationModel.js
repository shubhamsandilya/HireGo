// import { application } from "express";

// const { Schema, model } = require("mongoose");
import mongoose from "mongoose";

const ApplicationModel = new mongoose.Schema({
  name: String,
  email: String,
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Jobs" },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  phone: Number,
  resume: String,
  CV: String,
});

const application = mongoose.model("application", ApplicationModel);
export default application;
