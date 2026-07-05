import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { BsStars } from "react-icons/bs";
import { FiCheckCircle, FiRefreshCw, FiArrowRight, FiPlusCircle } from "react-icons/fi";

import { apiRequest } from "../utils";
import ScoreGauge from "./ScoreGauge";
import Loading from "./Loading";

const bandLabel = (s) =>
  s >= 75 ? "Strong match" : s >= 50 ? "Good match" : "Fair match";

const AiMatchCard = ({ jobId, compact = false }) => {
  const account = useSelector((state) => state.user)?.user || {};
  const profile = account?.user
    ? { ...account.user, token: account.token }
    : account;

  const [status, setStatus] = useState("idle"); // idle | loading | done | error | needsProfile
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const hasProfile =
    Boolean(profile?.about) ||
    (profile?.skills?.length || 0) > 0 ||
    (profile?.experience?.length || 0) > 0;

  const analyze = async () => {
    if (!hasProfile) {
      setStatus("needsProfile");
      return;
    }
    setStatus("loading");
    setErrMsg("");
    const res = await apiRequest({
      url: `/ai/match-job-by-profile?jobId=${jobId}`,
      token: profile?.token,
      method: "GET",
    });
    if (res?.needsProfile) {
      setStatus("needsProfile");
    } else if (res?.aiResponse) {
      setResult(res.aiResponse);
      setStatus("done");
    } else {
      setErrMsg(res?.message || "Couldn't analyze right now. Please try again.");
      setStatus("error");
    }
  };

  const shell = (children) => (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
            <BsStars className="text-sm" />
          </span>
          AI Match
        </h3>
        {status === "done" && (
          <button
            type="button"
            onClick={analyze}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-blue-600"
          >
            <FiRefreshCw /> Re-analyze
          </button>
        )}
      </div>
      {children}
    </div>
  );

  // --- Profile-incomplete nudge --------------------------------------------
  if (status === "needsProfile") {
    return shell(
      <div className="text-sm text-slate-600">
        <p>Complete your profile to get an accurate match for this role.</p>
        <Link
          to="/user-profile"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Complete profile <FiArrowRight />
        </Link>
      </div>
    );
  }

  // --- Loading --------------------------------------------------------------
  if (status === "loading") {
    return shell(
      <div className="flex items-center gap-3 py-2 text-sm text-slate-500">
        <Loading />
        Analyzing how well you fit this role…
      </div>
    );
  }

  // --- Idle / error CTA -----------------------------------------------------
  if (status !== "done") {
    return shell(
      <div className="text-sm text-slate-600">
        <p>
          See how well your profile fits this role — powered by AI. Get a match
          score, your strengths, and skills to work on.
        </p>
        {errMsg && <p className="mt-2 text-red-600">{errMsg}</p>}
        <button
          type="button"
          onClick={analyze}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <BsStars /> {status === "error" ? "Try again" : "Analyze my fit"}
        </button>
      </div>
    );
  }

  // --- Result ---------------------------------------------------------------
  const { matchScore = 0, strengths = [], missingSkills = [], summary } = result;

  // Compact variant (e.g. on the apply page)
  if (compact) {
    return shell(
      <div className="flex items-center gap-4">
        <ScoreGauge score={matchScore} size={72} stroke={6} />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">{bandLabel(matchScore)}</p>
          {summary && (
            <p className="text-sm leading-relaxed text-slate-500">{summary}</p>
          )}
        </div>
      </div>
    );
  }

  return shell(
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-5">
        <ScoreGauge score={matchScore} size={120} label={bandLabel(matchScore)} />
        {summary && (
          <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {strengths.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Your strengths
            </p>
            <ul className="flex flex-col gap-1.5">
              {strengths.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <FiCheckCircle className="mt-0.5 shrink-0 text-green-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingSkills.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Skills to strengthen
            </p>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                >
                  {s}
                </span>
              ))}
            </div>
            <Link
              to="/user-profile"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              <FiPlusCircle /> Add these to your profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiMatchCard;
