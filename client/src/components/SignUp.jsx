import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { BiBriefcaseAlt2, BiBuildings } from "react-icons/bi";
import toast from "react-hot-toast";

import TextInput from "./TextInput";
import CustomButton from "./CustomButton";
import { apiRequest } from "../utils";
import { Login } from "../redux/userSlice";
import { Office } from "../assets";

const EMAIL_PATTERN = {
  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: "Enter a valid email address",
};

const SignUp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [isRegister, setIsRegister] = useState(false);
  const [accountType, setAccountType] = useState("seeker");
  const [showPassword, setShowPassword] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onChange" });

  const isSeeker = accountType === "seeker";

  const switchAccountType = (type) => {
    setAccountType(type);
    setErrMsg("");
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setErrMsg("");
    setShowPassword(false);
    reset();
  };

  const onSubmit = async (data) => {
    setErrMsg("");

    const url = isRegister
      ? isSeeker
        ? "auth/register"
        : "companies/register"
      : isSeeker
      ? "auth/login"
      : "companies/login";

    const res = await apiRequest({ url, data, method: "POST" });

    if (!res || res.status === "failed") {
      const message = res?.message || "Something went wrong. Please try again.";
      setErrMsg(message);
      toast.error(message);
      return;
    }

    toast.success(res?.message || "Signed in successfully");
    const userInfo = { token: res?.token, ...res?.user };
    dispatch(Login(userInfo));
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    navigate(from, { replace: true });
  };

  return (
    <section className="bg-[#f7fdfd] min-h-[calc(100vh-72px)] flex items-center">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-5xl grid md:grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
          {/* Brand / illustration panel */}
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-white">
            <div>
              <span className="text-2xl font-bold">
                Hire<span className="text-blue-200">Go</span>
              </span>
              <h2 className="mt-8 text-3xl font-bold leading-snug">
                Find your dream job, or your next great hire.
              </h2>
              <p className="mt-4 text-blue-100">
                Search thousands of openings, apply in one click, and manage
                everything from a single dashboard.
              </p>
            </div>
            <img
              src={Office}
              alt=""
              className="mt-8 max-h-60 w-full rounded-xl object-cover"
            />
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-10">
            <h3 className="text-2xl font-semibold text-gray-900">
              {isRegister ? "Create your account" : "Welcome back"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isRegister
                ? "Join HireGo in less than a minute."
                : "Sign in to continue to HireGo."}
            </p>

            {/* Account type toggle */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                aria-pressed={isSeeker}
                onClick={() => switchAccountType("seeker")}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
                  isSeeker
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <BiBriefcaseAlt2 className="h-4 w-4" />
                Job Seeker
              </button>
              <button
                type="button"
                aria-pressed={!isSeeker}
                onClick={() => switchAccountType("company")}
                className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
                  !isSeeker
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <BiBuildings className="h-4 w-4" />
                Company
              </button>
            </div>

            <form
              className="mt-2 flex flex-col"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* Name fields (register only) */}
              {isRegister &&
                (isSeeker ? (
                  <div className="flex gap-3">
                    <div className="w-1/2">
                      <TextInput
                        label="First Name"
                        placeholder="e.g. James"
                        type="text"
                        register={register("firstName", {
                          required: "First name is required",
                        })}
                        error={errors.firstName?.message}
                      />
                    </div>
                    <div className="w-1/2">
                      <TextInput
                        label="Last Name"
                        placeholder="e.g. Wagonner"
                        type="text"
                        register={register("lastName", {
                          required: "Last name is required",
                        })}
                        error={errors.lastName?.message}
                      />
                    </div>
                  </div>
                ) : (
                  <TextInput
                    label="Company Name"
                    placeholder="e.g. Acme Inc."
                    type="text"
                    register={register("name", {
                      required: "Company name is required",
                    })}
                    error={errors.name?.message}
                  />
                ))}

              <TextInput
                label="Email Address"
                placeholder="email@example.com"
                type="email"
                register={register("email", {
                  required: "Email address is required",
                  pattern: EMAIL_PATTERN,
                })}
                error={errors.email?.message}
              />

              <TextInput
                label="Password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                register={register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                error={errors.password?.message}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible className="h-5 w-5" />
                    ) : (
                      <AiOutlineEye className="h-5 w-5" />
                    )}
                  </button>
                }
              />

              {isRegister && (
                <TextInput
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  type={showPassword ? "text" : "password"}
                  register={register("cPassword", {
                    validate: (value) =>
                      value === getValues("password") ||
                      "Passwords do not match",
                  })}
                  error={errors.cPassword?.message}
                />
              )}

              {errMsg && (
                <div
                  role="alert"
                  className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {errMsg}
                </div>
              )}

              <CustomButton
                type="submit"
                isLoading={isSubmitting}
                title={
                  isSubmitting
                    ? "Please wait…"
                    : isRegister
                    ? "Create Account"
                    : "Sign In"
                }
                containerStyles="mt-6 w-full rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              />
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              {isRegister
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-2 font-semibold text-blue-600 hover:text-blue-700"
              >
                {isRegister ? "Sign In" : "Create Account"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUp;
