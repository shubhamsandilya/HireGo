import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AiOutlineArrowRight } from "react-icons/ai";
import { FiUploadCloud } from "react-icons/fi";

import { apiRequest, handleFileUpload, computeProfileCompletion } from "../utils";
import { Loading, ProfileRing, ResumePreview } from "../components";
import success from "../assets/success.png";

const Apply = () => {
  const account = useSelector((state) => state.user)?.user || {};
  const profile = account?.user
    ? { ...account.user, token: account.token }
    : account;
  const { id } = useParams();
  const navigate = useNavigate();

  const { percent } = computeProfileCompletion(profile);

  const [loading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [resume, setResume] = useState(""); // freshly picked File
  const [useProfileResume, setUseProfileResume] = useState(
    Boolean(profile?.cvUrl)
  );

  const [formData, setFormData] = useState({
    fullName: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
    email: profile?.email || "",
    phoneNumber: profile?.contact || "",
    coverLetter: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    // Resolve the resume URL: a newly uploaded file wins, otherwise fall back
    // to the resume already saved on the profile.
    let resumeUrl = useProfileResume ? profile?.cvUrl : "";

    setIsLoading(true);
    try {
      if (resume) resumeUrl = await handleFileUpload(resume);

      if (!resumeUrl) {
        setErrMsg(
          "Please attach a resume — upload one here or add it to your profile."
        );
        setIsLoading(false);
        return;
      }

      const payload = {
        ...formData,
        resume: resumeUrl,
        currentUser: profile?._id,
      };

      await apiRequest({
        url: `/apply/${id}`,
        token: profile?.token,
        data: payload,
        method: "POST",
      });

      setIsSubmitted(true);
    } catch (error) {
      console.log(error);
      setErrMsg("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  if (isSubmitted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f7fdfd] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <img src={success} alt="Success" className="mx-auto h-16 w-16" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Application submitted!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your application has been sent successfully. You can track its status
            from your applications.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/apply-history"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              View my applications
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Back to jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fdfd] py-10">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="text-2xl font-bold text-slate-900">Job Application</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review your details and submit your application.
        </p>

        {/* Applicant + profile-completion suggestion */}
        <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <ProfileRing
            src={profile?.profileUrl}
            alt={profile?.firstName}
            percent={percent}
            size={72}
            stroke={5}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">
              {`${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
                "Your profile"}
            </p>
            {percent < 100 ? (
              <p className="text-sm text-slate-500">
                Your profile is{" "}
                <span className="font-semibold text-blue-600">{percent}%</span>{" "}
                complete. A stronger profile gets more responses.
              </p>
            ) : (
              <p className="text-sm text-green-600">
                Your profile looks great — good luck!
              </p>
            )}
          </div>
          {percent < 100 && (
            <button
              type="button"
              onClick={() => navigate("/user-profile")}
              className="hidden shrink-0 items-center gap-1 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white sm:inline-flex"
            >
              Complete <AiOutlineArrowRight />
            </button>
          )}
        </div>

        {/* Application form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                className={inputCls}
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                className={inputCls}
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Phone Number
            </label>
            <input
              className={inputCls}
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Resume — sourced from the profile, overridable per application */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Resume
            </label>

            {profile?.cvUrl && useProfileResume && !resume ? (
              <div className="flex flex-col gap-2">
                <ResumePreview url={profile.cvUrl} compact />
                <div className="text-xs text-slate-500">
                  Using the resume from your profile.{" "}
                  <button
                    type="button"
                    onClick={() => setUseProfileResume(false)}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Upload a different one
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50/40">
                  <FiUploadCloud className="text-lg text-blue-600" />
                  {resume ? (
                    <span className="font-medium text-slate-700">
                      {resume.name}
                    </span>
                  ) : (
                    "Click to upload your resume (PDF/DOC)"
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setResume(e.target.files[0])}
                  />
                </label>
                {profile?.cvUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setResume("");
                      setUseProfileResume(true);
                    }}
                    className="self-start text-xs font-medium text-blue-600 hover:underline"
                  >
                    Use profile resume instead
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Cover Letter
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={5}
              name="coverLetter"
              placeholder="Tell the recruiter why you're a great fit…"
              value={formData.coverLetter}
              onChange={handleChange}
              required
            />
          </div>

          {errMsg && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {errMsg}
            </div>
          )}

          <button
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? <Loading /> : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Apply;
