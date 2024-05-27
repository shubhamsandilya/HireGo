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
