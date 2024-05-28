import React, { useState } from "react";

function AppliedJobCard({ job }) {
  const [length, setlength] = useState(250);
  const [status, setStatus] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const description = job.Jobs_data.detail[0].desc;
  const maxLength = 250;

  const toggleDescription = () => {
    setIsExpanded(!isExpanded);
  };

  const stages = ["Applied", "Viewed", "Interviewing", "Hired", "Rejected"];
  const currentStageIndex = stages.indexOf(job.status) + 1;
  console.log(job);
  return (
    <div className="max-w-full rounded overflow-hidden shadow-lg bg-white m-4">
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{job.Jobs_data.jobTitle}</div>
        <p className="text-gray-700 text-base">
          {isExpanded || description.length <= maxLength ? (
            <span>{description}</span>
          ) : (
            <span className="cursor-text">
              {description.substring(0, maxLength)}...
              <span
                className="text-blue-500 cursor-pointer "
                onClick={toggleDescription}
              >
                Read more
              </span>
            </span>
          )}
          {isExpanded && description.length > maxLength && (
            <span
              className="text-blue-500 cursor-pointer"
              onClick={toggleDescription}
            >
              Show less
            </span>
          )}
        </p>
      </div>
      <div className="px-6 pt-4 pb-2">
        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          #{job.Jobs_data.companyName}
        </span>
        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          #{job.Jobs_data.location}
        </span>
        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
          #{job.createdAt.split("T")[0]}
        </span>
        <span
          onClick={() => setStatus(!status)}
          className=" cursor-pointer inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-blue-500 mr-2 mb-2"
        >
          #Status
        </span>
      </div>
      {status && (
        <div className="w-full p-4">
          {/* Stage Labels */}
          <div className="flex justify-between mb-4">
            {stages.map((stage, index) => (
              <div key={stage} className="text-center flex-1">
                <span
                  className={`text-sm ${
                    index <= currentStageIndex - 1
                      ? "text-blue-500"
                      : "text-gray-500"
                  }`}
                >
                  {stage}
                </span>
              </div>
            ))}
          </div>
          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-gray-200 rounded-full">
            <div
              className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full"
              style={{
                width: `${(currentStageIndex / stages.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AppliedJobCard;
