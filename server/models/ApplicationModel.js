// import { application } from "express";

// const { Schema, model } = require("mongoose");
import mongoose from "mongoose";

const ApplicationModel = new mongoose.Schema(
  {
    name: String,
    email: String,
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Jobs" },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    status: {
      type: String,
      enum: ["Applied", "Viewed", "Interviewing", "Hired", "Rejected"],
      default: "applied",
    },
    phone: Number,
    resume: String,
    CV: String,
  },
  {
    timestamps: true,
  }
);

const application = mongoose.model("application", ApplicationModel);
export default application;
