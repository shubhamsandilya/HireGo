import { GoogleGenAI } from "@google/genai";
import Jobs from "../models/jobModel.js";
import Users from "../models/userModel.js";

const google = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});
const createPrompt = (userProfile, jobDescription) => {
    return `
You are an AI career assistant.

Compare the candidate profile with the job description.

Candidate Profile:
${JSON.stringify(userProfile, null, 2)}

Job Description:
${JSON.stringify(jobDescription, null, 2)}

Return ONLY valid JSON in this format:

{
  "matchScore": number between 0 and 100,
  "strengths": ["string"],
  "missingSkills": ["string"],
  "summary": "string"
}

Rules:
- No markdown
- No explanation outside JSON
- Maximum 3 strengths
- Maximum 3 missing skills
- Address the user directly using "you" and "your"
- Never use phrases like "the candidate" or "the applicant"
- Make the summary encouraging and actionable
`;
};
export const matchJobByProfile = async (req, res,next) => {
    try {
        const { jobId } = req.query;
        if(!jobId){
            return res.status(400).json({ message: "Job ID is required" });
        }
        const job = await Jobs.findById(jobId);
        const user =await Users.findById(req.body.user.userId);
        if(!job || !user){
            return res.status(404).json({ message: `${!job ? `Job` : `User`} not found` });
        }
        const jobDescription = job.detail;
        const profile = {about :user?.about,skills:user?.skills,experience:user?.experience  };
        const prompt = createPrompt
        (profile,jobDescription);

       const response = await google.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        responseMimeType: "application/json"
    }
});
console.log(response)
const aiResult = JSON.parse(response.text);
 res.status(200).json({
            job,
            aiResponse:aiResult
        })
    } catch (error) {
      console.log(error)
      return res.status(500).json({ message: "Failed to match job with profile", error });
    }
}
