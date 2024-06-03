// import { application } from "express"
import application from "../models/ApplicationModel.js";
import Jobs from "../models/jobModel.js";

export const postApplication = async (req, res, next) => {
  const { fullName, email, phoneNumber, resume, coverLetter, currentUser } =
    req?.body;
  //   console.log(req?.body);
  console.log(req?.params.id);
  if (!fullName || !phoneNumber || !coverLetter || !email || !resume)
    res
      .status(401)
      .json({ success: false, Message: "All fileds are mandatory" });
  console.log("first");
  try {
    const result = await application.create({
      name: fullName,
      email,
      phone: phoneNumber,
      resume,
      jobId: req?.params?.id,
      CV: coverLetter,
      applicantId: currentUser,
    });
    const updateCmp = await Jobs.findOneAndUpdate(
      {
        _id: req?.params?.id,
      },
      {
        application: result?._id,
      }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log(error);
    next(error.Message);
  }
};

export const getAplication = async (req, res, next) => {
  const { currentUser } = req?.query;
  console.log(currentUser);
  try {
    const result = await application.aggregate([
      {
        $match: {
          $expr: { $eq: ["$applicantId", { $toObjectId: currentUser }] },
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "Jobs_data",
        },
      },
      {
        $unwind: { path: "$Jobs_data" },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          "Jobs_data.jobTitle": 1,
          createdAt: 1,
          "Jobs_data.location": 1,
          "Jobs_data.detail[0].desc": 1,
          "Jobs_data.company": 1,
          "Jobs_data.companyName": 1,
          "Jobs_data.detail": 1,
          company: 1,
          status: 1,
        },
      },
    ]);
    const company = await application.find({
      where: {},
    });
    res.send(result);
  } catch (e) {
    console.log(e);
    next();
  }
};
export const getApplicants = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    console.log(req.params);

    // Find the job by ID and populate the applications
    const job = await application
      .find({ jobId: jobId })
      .populate({ path: "applicantId", select: "profileUrl" })
      .select({
        name: 1,
        email: 1,
        phone: 1,
        resume: 1,
        CV: 1,
        url: "$applicantId.profileUrl",
        // "applicantId.profileUrl": 1,
      });
    // .populate("company")
    // .populate("application");
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
