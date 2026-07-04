import { GoLocation } from "react-icons/go";
import { BsArrowUpRight } from "react-icons/bs";
import moment from "moment";
import { Link } from "react-router-dom";

const JobCard = ({ job }) => {
  const companyName = job?.name || job?.company?.name || "Company";
  const logo = job?.logo || job?.company?.profileUrl || job?.profileUrl;
  const fallbackLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    companyName
  )}&background=1d4fd8&color=fff&bold=true`;

  // `detail` is an array ([{ desc, requirements }]) per the schema, but guard
  // against an object shape too, just in case.
  const detail = Array.isArray(job?.detail) ? job.detail[0] : job?.detail;
  const description = detail?.desc || job?.desc || "";

  return (
    <Link to={`/job-detail/${job?._id}`} className="group w-full md:w-auto">
      <div
        className="relative flex h-[16rem] w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm transition-all
        duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 md:h-[18rem] md:w-[16rem] 2xl:w-[18rem]"
      >
        {/* Accent bar revealed on hover */}
        <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-blue-600 to-cyan-500 transition-transform duration-300 group-hover:scale-x-100" />

        <div className="flex items-start gap-3">
          <img
            src={logo || fallbackLogo}
            onError={(e) => {
              e.currentTarget.src = fallbackLogo;
            }}
            alt={companyName}
            className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 object-cover"
          />

          <div className="flex min-w-0 flex-col">
            <p className="line-clamp-2 text-base font-semibold leading-tight text-slate-900 transition-colors group-hover:text-blue-700">
              {job?.jobTitle}
            </p>
            <span className="mt-0.5 truncate text-sm font-medium text-slate-500">
              {companyName}
            </span>
            <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <GoLocation className="text-slate-400" />
              {job?.location || "Remote"}
            </span>
          </div>
        </div>

        <p className="line-clamp-3 py-3 text-sm leading-relaxed text-slate-500">
          {description ? description : "No description provided."}
        </p>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {job?.jobType || "Full-Time"}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            {job?.createdAt ? moment(job.createdAt).fromNow() : ""}
            <BsArrowUpRight className="text-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
