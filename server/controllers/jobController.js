import mongoose from "mongoose";
import Jobs from "../models/jobModel.js";
import Companies from "../models/companiesModel.js";
import redis, { clearCache } from "../config/redis.js";
import { createEmbedding } from "../services/embeddingService.js";

// Minimum vector-search relevance (Atlas score, ~0 = unrelated, ~1 = very close).
// Results below this are dropped so a nonsense search returns nothing instead of
// the "least unrelated" jobs. Tune it: too LOW lets junk through, too HIGH hides
// good matches. Watch the logged scores for real searches and adjust.
const MIN_VECTOR_SCORE = 0.75;

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

    // Only real company accounts can post jobs. Verify the company exists
    // BEFORE creating the job, so a wrong account never leaves an orphan job.
    const company = await Companies.findById(id);
    if (!company) {
      return res.status(403).json({
        success: false,
        message:
          "Only company accounts can post jobs. Please sign in with a company account.",
      });
    }

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
    const embedding = await createEmbedding(`${jobTitle} ${desc} ${requirements}`);
    const job = new Jobs({ ...jobPost, embedding });
    await job.save();

    // Link the job to the company. Atomic $push via findByIdAndUpdate avoids
    // the pre-save hook (which would otherwise re-hash the password).
    await Companies.findByIdAndUpdate(id, { $push: { jobPosts: job._id } });

    await clearCache("jobs:*", "companyJobs:*");

    res.status(200).json({
      success: true,
      message: "Job Posted Successfully",
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

    // The job text changed, so its old embedding no longer describes it.
    // Regenerate the fingerprint from the NEW text — using the exact same
    // recipe as createJob — so search keeps matching the current content.
    const embedding = await createEmbedding(
      `${jobTitle} ${desc} ${requirements}`
    );

    const jobPost = {
      jobTitle,
      jobType,
      location,
      salary,
      vacancies,
      experience,
      detail: { desc, requirements },
      embedding,
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

    // 🔑 Cache key for this exact query
    const cacheKey = `jobs:${JSON.stringify(req.query)}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const types = jtype?.split(","); // "Full-Time,Part-Time"
    const expRange = exp?.split("-"); // "2-6"

    // Build each filter piece once so we can reuse them two ways below.
    // location uses regex (partial match); jobType/experience are exact/range.
    const locationFilter = location
      ? { location: { $regex: location, $options: "i" } }
      : null;
    const jobTypeFilter = jtype ? { jobType: { $in: types } } : null;
    const expFilter = exp
      ? {
          experience: {
            $gte: Number(expRange[0]) - 1,
            $lte: Number(expRange[1]) + 1,
          },
        }
      : null;

    // Full filter for browse mode + keyword fallback — plain Mongo, so the
    // regex location works fine here.
    const queryObject = { ...locationFilter, ...jobTypeFilter, ...expFilter };

    // Vector pre-filter: only fields Atlas can pre-filter exactly (jobType,
    // experience). location uses regex — Atlas pre-filters can't do regex — so
    // it stays a post-search $match to keep partial matching ("del" -> "New Delhi").
    const vectorFilter = { ...jobTypeFilter, ...expFilter };

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const sortMap = {
      Newest: "-createdAt",
      Oldest: "createdAt",
      "A-Z": "jobTitle",
      "Z-A": "-jobTitle",
    };
    const companyPopulate = { path: "company", select: "name profileUrl" };

    let jobs = [];
    let totalJobs = 0;

    if (search) {
      // ---------- Semantic (vector) search: only when the user typed a query ----------
      try {
        // Embed the user's SEARCH TEXT (not the Mongo filter object).
        // "RETRIEVAL_QUERY" tells Gemini this is a search phrase, so its vector
        // is optimized to match against the "RETRIEVAL_DOCUMENT" job vectors.
        const queryEmbedding = await createEmbedding(search, "RETRIEVAL_QUERY");

        const vectorSearchStage = {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 200,
          limit: 100,
        };
        // Pre-filter DURING the search: jobType/experience narrow the candidate
        // pool BEFORE nearest-neighbours are chosen, so "React in Delhi" no
        // longer loses good jobs that sat just outside the top 100.
        if (Object.keys(vectorFilter).length) {
          vectorSearchStage.filter = vectorFilter;
        }

        const pipeline = [{ $vectorSearch: vectorSearchStage }];

        // location uses regex, so it can't pre-filter — match it right after.
        if (locationFilter) {
          pipeline.push({ $match: locationFilter });
        }
        // Join the company so job cards have the name + logo.
        pipeline.push(
          {
            $lookup: {
              from: "companies",
              localField: "company",
              foreignField: "_id",
              as: "company",
            },
          },
          { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              jobTitle: 1,
              jobType: 1,
              location: 1,
              salary: 1,
              vacancies: 1,
              experience: 1,
              companyName: 1,
              detail: 1,
              createdAt: 1,
              "company._id": 1,
              "company.name": 1,
              "company.profileUrl": 1,
              score: { $meta: "vectorSearchScore" },
            },
          }
        );

        const rawPool = await Jobs.aggregate(pipeline);
        // Drop weak matches so an off-topic search returns nothing rather than
        // the "least unrelated" jobs. rawPool is already sorted by score.
        const pool = rawPool.filter((j) => j.score >= MIN_VECTOR_SCORE);
        totalJobs = pool.length;
        // Keep the relevance order; widen the window as the user loads more.
        jobs = pool.slice(0, limit * page);
      } catch (err) {
        // ---------- Fallback: keyword search (works without Atlas vector search) ----------
        console.log("Vector search unavailable, using keyword search:", err?.message);
        const textFilter = {
          ...queryObject,
          $or: [
            { jobTitle: { $regex: search, $options: "i" } },
            { companyName: { $regex: search, $options: "i" } },
            { "detail.desc": { $regex: search, $options: "i" } },
          ],
        };
        totalJobs = await Jobs.countDocuments(textFilter);
        jobs = await Jobs.find(textFilter)
          .select("-embedding")
          .populate(companyPopulate)
          .sort(sortMap[sort] || "-createdAt")
          .limit(limit * page);
      }
    } else {
      // ---------- Browse mode: plain filtered listing, no embeddings needed ----------
      totalJobs = await Jobs.countDocuments(queryObject);
      jobs = await Jobs.find(queryObject)
        .select("-embedding")
        .populate(companyPopulate)
        .sort(sortMap[sort] || "-createdAt")
        .limit(limit * page);
    }

    const numOfPage = Math.ceil(totalJobs / limit);

    const response = {
      success: true,
      totalJobs,
      data: jobs,
      page,
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
