// import React from "react";
import axios from "axios";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaFileAlt,
  FaUser,
} from "react-icons/fa";
import { apiRequest } from "../utils";
import { useState } from "react";
import { useSelector } from "react-redux";

const applicant = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "123-456-7890",
  address: "123 Main St, Anytown, USA",
  resume: "https://example.com/resume.pdf",
  coverLetter:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
};

const Applicants = () => {
  const { user } = useSelector((state) => state.user);
  // console.log(user);
  const [Applicant, setApplicant] = useState();
  const JobId = window.location.pathname.split("/")[2];
  console.log(JobId);
  const fetchApplicants = async () => {
    const response = await apiRequest({
      url: `apply/${JobId}/applicants`,
      token: applicant?.token,
      data: "",
      method: "GET",
    });
    //   const data = await response.json();
    setApplicant(response.data);
    console.log(response);
  };
  fetchApplicants();
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      <div className="flex items-center mb-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mr-4">
          <FaUser className="text-gray-500 text-5xl" />
        </div>
        <div className="">
          <h1 className="text-3xl text-blue-600  font-bold">
            {applicant.name}
          </h1>
          <p className="text-gray-600 flex gap-2 text mt-3  ">
            <FaEnvelope />
            {applicant.email}
          </p>
          <p className="text-gray-600 flex ">
            {" "}
            <FaPhone />
            {applicant.phone}
          </p>
          <p className="text-gray-600 flex ">
            <FaMapMarkerAlt />
            {applicant.address}
          </p>
          {/* </FaMapMarkerAlt> */}
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Resume</h2>
        <a
          href={applicant.resume}
          className="text-blue-500 underline flex items-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaFileAlt className="mr-2" /> View Resume
        </a>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-2">Cover Letter</h2>
        <p className="text-gray-700">{applicant.coverLetter}</p>
      </div>
    </div>
  );
};

export default Applicants;
