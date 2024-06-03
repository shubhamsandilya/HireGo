import { useEffect, useState } from "react";
// import Applicants from "../components/Applicants";
// import JobCard from "../components/JobCard";
import { Link } from "react-router-dom";
import moment from "moment";

import { GoLocation } from "react-icons/go";

import { apiRequest } from "../utils";
import { useSelector } from "react-redux";

function YourOpenings() {
  const [jobs, setJobs] = useState([]);
  const user = useSelector((state) => state.user);

  useEffect(() => {
    // Fetch job applications from your backend
    const fetchJobs = async () => {
      const response = await apiRequest({
        url: `jobs/get-job-by-company/${user.user._id}`,
        token: user?.user?.token,
        data: "",
        method: "GET",
      });
      //   const data = await response.json();
      setJobs(response.data);
      console.log(response);
    };

    fetchJobs();
  }, []);
  console.log(jobs);
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl text-blue-600 font-bold mb-5 text-center">
        Your Applications
      </h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <div key={job.id} className="">
            <Link to={`/job-detail/${job?._id}`}>
              <div
                className="w-full md:w-[16rem] 2xl:w-[18rem] h-[16rem] md:h-[18rem] bg-white flex flex-col justify-between shadow-lg 
                  rounded-md px-3 py-5 "
              >
                <div className="w-full h-full flex flex-col justify-between">
                  <div className="flex gap-3">
                    <img
                      src={
                        !job?.profileUrl > 0
                          ? job?.company?.profileUrl
                          : job?.profileUrl
                      }
                      alt={job?.name}
                      className="w-14 h-14"
                    />

                    <div className="w-full h-16 flex flex-col justify-center">
                      <p className="w-full h-12 flex items-center text-lg font-semibold overflow-hidden leading-5 ">
                        {job?.jobTitle}
                      </p>
                      <span className="flex gap-2 items-center">
                        <GoLocation className="text-slate-900 text-sm" />
                        {job?.location}
                      </span>
                    </div>
                  </div>

                  <div className="py-3">
                    <p className="text-sm">
                      {job?.detail[0]?.desc?.slice(0, 150) + "..."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="bg-[#1d4fd826] text-[#1d4fd8] py-0.5 px-1.5 rounded font-semibold text-sm">
                      {job?.jobType}
                    </p>
                    <span className="text-gray-500 text-sm">
                      {moment(job?.createdAt).fromNow()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            <Link to={`/applicants/${job?._id}`}>
              <p className="bg-[#1d4fd826] text-[#1d4fd8] py-0.5 px-1.5 rounded font-semibold text-sm text-center w-full md:w-[16rem] 2xl:w-[18rem] cursor-pointer mb-2 ">
                Applicants
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YourOpenings;
