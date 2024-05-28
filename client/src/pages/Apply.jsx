// JobApplicationForm.js

import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { apiRequest, handleFileUpload } from "../utils";
import success from "../assets/success.png";
// import { Login } from "../redux/userSlice";
import { Loading } from "../components";
import { useParams } from "react-router-dom";

const Apply = () => {
  const user = useSelector((state) => state.user);
  const { id } = useParams();
  //   console.log("post id====", id);
  console.log(user.user._id);
  const [loading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resume, setResume] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    resume: "",
    coverLetter: "",
  });

  //   const dispatch = useDispatch();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const onSubmit = async (data) => {
    setIsLoading(true);
    // setErrMsg(null);
    const uri = resume && (await handleFileUpload(resume));
    console.log(uri, "==URL");
    const currentUser = user.user._id;
    const newData = uri ? { ...data, resume: uri, currentUser } : data;
    // console.log("newData===", newData);
    try {
      const res = await apiRequest({
        url: `/apply/${id}`,
        token: user?.user?.token,
        data: newData,
        method: "POST",
      });
      console.log(res);
      setIsLoading(false);
      setIsSubmitted(true);
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Handle form submission here
    onSubmit(formData);
    // console.log(formData);
  };

  return (
    <div className="max-w-md mx-auto">
      {isSubmitted ? (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex flex-col  items-center"
          role="alert"
        >
          <img
            src="../assets/success.png"
            alt="Success logo"
            width={35}
            height={35}
          />
          <strong className="font-bold">Success!</strong>
          <span className="block sm:inline">
            Your job application has been submitted successfully.
          </span>
          <Link to={"/"}>
            Back to home page <u>click here</u>{" "}
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-semibold mb-6">Job Application Form</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="fullName"
                type="text"
                placeholder="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="phoneNumber"
              >
                Phone Number
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="phoneNumber"
                type="tel"
                placeholder="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="resume"
              >
                Resume
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                name="resume"
                // onChange={handleChange}
                onChange={(e) => setResume(e.target.files[0])}
                required
              />
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="coverLetter"
              >
                Cover Letter
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="coverLetter"
                placeholder="Cover Letter"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                {loading ? <Loading /> : "Submit Application"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default Apply;
