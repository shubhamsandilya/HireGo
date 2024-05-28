import { useEffect, useState } from "react";
import JobCard from "../components/AppliedJobCard";
import { apiRequest } from "../utils";
import { useSelector } from "react-redux";

function ApplyHistory() {
  const [jobs, setJobs] = useState([]);
  const user = useSelector((state) => state.user);
  console.log(user.user._id);

  useEffect(() => {
    // Fetch job applications from your backend
    const fetchJobs = async () => {
      const response = await apiRequest({
        url: `/apply/applications/?currentUser=${user.user._id}`,
        token: user?.user?.token,
        data: "",
        method: "GET",
      });
      //   const data = await response.json();
      setJobs(response);
      console.log(response);
    };

    fetchJobs();
  }, []);
  console.log(jobs);
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl text-blue-600 font-bold mb-5">
        Your Applications
      </h1>
      <div className="flex flex-col w-full flex-wrap -m-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

export default ApplyHistory;
