import { GoLocation } from "react-icons/go";
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
    <Link to={`/job-detail/${job?._id}`} className="w-full md:w-auto">
      <div
        className="flex h-[16rem] w-full flex-col justify-between rounded-lg bg-white px-4 py-5 shadow-md transition
        hover:-translate-y-1 hover:shadow-xl md:h-[18rem] md:w-[16rem] 2xl:w-[18rem]"
      >
        <div className="flex gap-3">
          <img
            src={logo || fallbackLogo}
            onError={(e) => {
              e.currentTarget.src = fallbackLogo;
            }}
            alt={companyName}
            className="h-14 w-14 rounded-md object-cover"
          />

          <div className="flex min-w-0 flex-col justify-center">
            <p className="line-clamp-2 text-lg font-semibold leading-tight text-gray-900">
              {job?.jobTitle}
            </p>
            <span className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <GoLocation className="text-slate-700" />
              {job?.location || "Remote"}
            </span>
          </div>
        </div>

        <p className="line-clamp-3 py-3 text-sm text-gray-600">
          {description ? description : "No description provided."}
        </p>

        <div className="flex items-center justify-between">
          <span className="rounded bg-[#1d4fd826] px-2 py-0.5 text-sm font-semibold text-[#1d4fd8]">
            {job?.jobType || "Full-Time"}
          </span>
          <span className="text-sm text-gray-500">
            {job?.createdAt ? moment(job.createdAt).fromNow() : ""}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
