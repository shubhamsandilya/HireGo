// import { application } from "express"
import application from "../models/ApplicationModel.js";

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
