import mongoose from "mongoose";
import Jobs from "../models/jobModel.js";
import Companies from "../models/companiesModel.js";
import redis, { clearCache } from "../config/redis.js";

export const createJob = async (req, res, next) => {
  try {
    const {
      jobTitle,
      jobType,
      location,
      salary,
      vacancies,
      experience,
      companyName,
      desc,
      requirements,
    } = req.body;

    if (
      !jobTitle ||
      !jobType ||
      !location ||
      !salary ||
      !companyName ||
      !requirements ||
      !desc
    ) {
      next("Please Provide All Required Fields");
      return;
    }

    const id = req.body.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No Company with id: ${id}`);

    const jobPost = {
      jobTitle,
      jobType,
      location,
      salary,
      vacancies,
      companyName,
      experience,
      detail: { desc, requirements },
      company: id,
    };

    const job = new Jobs(jobPost);
    await job.save();

    //update the company information with job id
    const company = await Companies.findById(id);

    company.jobPosts.push(job._id);
    const updateCompany = await Companies.findByIdAndUpdate(id, company, {
      new: true,
    });
    await clearCache("jobs:*", "companyJobs:*");

    res.status(200).json({
      success: true,
      message: "Job Posted SUccessfully",
      job,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const {
      jobTitle,
      jobType,
      location,
      salary,
      vacancies,
      experience,
      desc,
      requirements,
    } = req.body;
    const { jobId } = req.params;

    if (
      !jobTitle ||
      !jobType ||
      !location ||
      !salary ||
      !desc ||
      !requirements
    ) {
      next("Please Provide All Required Fields");
      return;
    }
    const id = req.body.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send(`No Company with id: ${id}`);

    const jobPost = {
      jobTitle,
      jobType,
      location,
      salary,
      vacancies,
      experience,
      detail: { desc, requirements },
      _id: jobId,
    };

    await Jobs.findByIdAndUpdate(jobId, jobPost, { new: true });
    await clearCache("jobs:*", `job:${jobId}`, "companyJobs:*");

    res.status(200).json({
      success: true,
      message: "Job Post Updated SUccessfully",
      jobPost,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getJobPosts = async (req, res, next) => {
  try {
    const { search, sort, location, jtype, exp } = req.query;
    // console.log(jtype);
 // 🔑 Create cache key
    const cacheKey = `jobs:${JSON.stringify(req.query)}`;
     const cachedData = await redis.get(cacheKey);
    //  console.log(cachedData);
    if (cachedData) {
      console.log("cached data served");
      return res.status(200).json(JSON.parse(cachedData));
    }
    const types = jtype?.split(","); //full-time,part-time
    const experience = exp?.split("-"); //2-6

    let queryObject = {};

    if (location) {
      queryObject.location = { $regex: location, $options: "i" };
    }

    if (jtype) {
      queryObject.jobType = { $in: types };
    }

    if (exp) {
      queryObject.experience = {
        $gte: Number(experience[0]) - 1,
        $lte: Number(experience[1]) + 1,
      };
    }

    if (search) {
      const searchQuery = {
        $or: [
          { jobTitle: { $regex: search, $options: "i" } },
          { jobType: { $regex: search, $options: "i" } },
        ],
      };
      queryObject = { ...queryObject, ...searchQuery };
    }

    let queryResult = Jobs.find(queryObject).populate({
      path: "company",
      select: "-password",
    });

    if (sort === "Newest") {
      queryResult = queryResult.sort("-createdAt");
    }
    if (sort === "Oldest") {
      queryResult = queryResult.sort("createdAt");
    }
    if (sort === "A-Z") {
      queryResult = queryResult.sort("jobTitle");
    }
    if (sort === "Z-A") {
      queryResult = queryResult.sort("-jobTitle");
    }

    // pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    //records count
    const totalJobs = await Jobs.countDocuments(queryResult);
    const numOfPage = Math.ceil(totalJobs / limit);

    queryResult = queryResult.limit(limit * page);

    const jobs = await queryResult;

 
    const response = {
      success: true,
      totalJobs,
      data: jobs,
      page: Number(page),
      numOfPage,
    };

    // ✅ Store in Redis (TTL = 120 sec)
    await redis.setex(cacheKey, 120, JSON.stringify(response));

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const jobCacheKey= `job:${id}`;
    const cachedData = await redis.get(jobCacheKey);
    if (cachedData) {
      console.log("cached data served for job by id");
      return res.status(200).json(JSON.parse(cachedData));
    }
    const job = await Jobs.findById({ _id: id }).populate({
      path: "company",
      select: "-password",
    });

    if (!job) {
      return res.status(200).send({
        message: "Job Post Not Found",
        success: false,
      });
    }

    //GET SIMILAR JOB POST
    const searchQuery = {
      $or: [
        { jobTitle: { $regex: job?.jobTitle, $options: "i" } },
        { jobType: { $regex: job?.jobType, $options: "i" } },
      ],
    };

    let queryResult = Jobs.find(searchQuery)
      .populate({
        path: "company",
        select: "-password",
      })
      .sort({ _id: -1 });

    queryResult = queryResult.limit(6);
    const similarJobs = await queryResult;
    const response = {
      message: "Job fetched successfully",
      success: true,
      data: job,
      similarJobs,
    };
    // ✅ Store in Redis (TTL = 120 sec)
    await redis.setex(jobCacheKey, 120, JSON.stringify(response));

    res.status(200).json({
...response
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const deleteJobPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Jobs.findByIdAndDelete(id);
    await clearCache("jobs:*", `job:${id}`, "companyJobs:*");

    res.status(200).send({
      success: true,
      messsage: "Job Post Delted Successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message });
  }
};

export const getJobByCompanyId = async (req, res, next) => {
  const { id } = req?.params;
  console.log(id);
  // console.log(req?.query);
  const cacheKey = `companyJobs:${id}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    console.log("cached data served for company jobs");
    return res.status(200).json(JSON.parse(cachedData));
  }
  try {
    const result = await Jobs.find({ company: id }).populate({
      path: "company",
      select: " profileUrl",
    });
    const response = {
      message: "Jobs fetched successfully",
      success: true,
      data: result,
    };
    // ✅ Store in Redis (TTL = 120 sec)
    await redis.setex(cacheKey, 120, JSON.stringify(response));
    return res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};
