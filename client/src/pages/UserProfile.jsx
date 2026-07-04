import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import {
  HiLocationMarker,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { AiOutlineMail, AiOutlineClose } from "react-icons/ai";
import { FiPhoneCall, FiPlus, FiTrash2, FiCheck, FiEdit2 } from "react-icons/fi";
import { BsStars } from "react-icons/bs";

import CustomButton from "../components/CustomButton";
import Loading from "../components/Loading";
import TextInput from "../components/TextInput";
import ProfileRing from "../components/ProfileRing";
import ResumePreview from "../components/ResumePreview";

import { apiRequest, handleFileUpload, computeProfileCompletion } from "../utils";
import { skillsList } from "../utils/data";
import { Login } from "../redux/userSlice";
import { NoProfile } from "../assets";

const blankExp = {
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  currentlyWorking: false,
  description: "",
};

const fmtMonth = (val) => {
  if (!val) return "";
  const m = moment(val, ["YYYY-MM", "YYYY-MM-DD"], true);
  return m.isValid() ? m.format("MMM YYYY") : val;
};

/* -------------------------------------------------------------------------- */
/*  Skills editor                                                             */
/* -------------------------------------------------------------------------- */
const SkillsEditor = ({ skills, setSkills }) => {
  const [input, setInput] = useState("");

  const addSkill = (raw) => {
    const val = raw.trim();
    if (!val) return;
    if (!skills.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setSkills([...skills, val]);
    }
    setInput("");
  };

  const removeSkill = (s) => setSkills(skills.filter((x) => x !== s));

  const suggestions = skillsList
    .filter(
      (s) =>
        !skills.some((x) => x.toLowerCase() === s.toLowerCase()) &&
        s.toLowerCase().includes(input.toLowerCase())
    )
    .slice(0, 6);

  return (
    <div>
      {skills.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
            >
              {s}
              <button
                type="button"
                onClick={() => removeSkill(s)}
                aria-label={`Remove ${s}`}
                className="text-blue-400 hover:text-blue-700"
              >
                <AiOutlineClose className="text-xs" />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSkill(input);
          }
        }}
        placeholder="Type a skill and press Enter"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {input && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSkill(s)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Experience editor                                                         */
/* -------------------------------------------------------------------------- */
const ExperienceEditor = ({ experience, setExperience }) => {
  const update = (i, field, value) =>
    setExperience(
      experience.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    );
  const add = () => setExperience([...experience, { ...blankExp }]);
  const remove = (i) => setExperience(experience.filter((_, idx) => idx !== i));

  const field =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="flex flex-col gap-4">
      {experience.map((exp, i) => (
        <div
          key={i}
          className="relative rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove experience"
            className="absolute right-3 top-3 text-slate-400 hover:text-red-500"
          >
            <FiTrash2 />
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={field}
              placeholder="Title (e.g. Frontend Developer)"
              value={exp.title}
              onChange={(e) => update(i, "title", e.target.value)}
            />
            <input
              className={field}
              placeholder="Company"
              value={exp.company}
              onChange={(e) => update(i, "company", e.target.value)}
            />
            <input
              className={field}
              placeholder="Location"
              value={exp.location}
              onChange={(e) => update(i, "location", e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                type="month"
                className={field}
                value={exp.startDate}
                onChange={(e) => update(i, "startDate", e.target.value)}
              />
              <span className="text-slate-400">–</span>
              <input
                type="month"
                className={`${field} ${exp.currentlyWorking ? "opacity-50" : ""}`}
                value={exp.endDate}
                disabled={exp.currentlyWorking}
                onChange={(e) => update(i, "endDate", e.target.value)}
              />
            </div>
          </div>

          <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="accent-blue-600"
              checked={exp.currentlyWorking}
              onChange={(e) => update(i, "currentlyWorking", e.target.checked)}
            />
            I currently work here
          </label>

          <textarea
            className={`${field} mt-3 resize-none`}
            rows={2}
            placeholder="What did you do in this role?"
            value={exp.description}
            onChange={(e) => update(i, "description", e.target.value)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
      >
        <FiPlus /> Add experience
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Edit-profile modal                                                        */
/* -------------------------------------------------------------------------- */
const UserForm = ({ profile, open, setOpen }) => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const [profileImage, setProfileImage] = useState("");
  const [uploadCv, setUploadCv] = useState("");
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Re-hydrate the form each time the modal opens.
  useEffect(() => {
    if (open) {
      reset({
        firstName: profile?.firstName || "",
        lastName: profile?.lastName || "",
        contact: profile?.contact || "",
        location: profile?.location || "",
        jobTitle: profile?.jobTitle || "",
        about: profile?.about || "",
      });
      setSkills(profile?.skills || []);
      setExperience(profile?.experience || []);
      setProfileImage("");
      setUploadCv("");
      setErrMsg("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrMsg("");

    let profileUrl = profile?.profileUrl;
    let cvUrl = profile?.cvUrl;

    if (profileImage) profileUrl = await handleFileUpload(profileImage);
    if (uploadCv) cvUrl = await handleFileUpload(uploadCv);

    const payload = {
      ...data,
      profileUrl,
      cvUrl,
      skills,
      experience: experience.filter((e) => e.title || e.company),
    };

    try {
      const res = await apiRequest({
        url: "/users/update-user",
        token: profile?.token,
        data: payload,
        method: "PUT",
      });

      if (res?.success && res?.user) {
        const userInfo = { token: res.token, ...res.user };
        dispatch(Login(userInfo));
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        setOpen(false);
      } else {
        setErrMsg(res?.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.log(err);
      setErrMsg("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={open ?? false} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    Edit Profile
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <AiOutlineClose size={20} />
                  </button>
                </div>

                <form
                  className="max-h-[75vh] overflow-y-auto px-6 py-5"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex gap-3">
                      <div className="w-1/2">
                        <TextInput
                          label="First Name"
                          placeholder="James"
                          register={register("firstName", {
                            required: "First Name is required",
                          })}
                          error={errors.firstName?.message}
                        />
                      </div>
                      <div className="w-1/2">
                        <TextInput
                          label="Last Name"
                          placeholder="Wagonner"
                          register={register("lastName", {
                            required: "Last Name is required",
                          })}
                          error={errors.lastName?.message}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-1/2">
                        <TextInput
                          label="Contact"
                          placeholder="Phone Number"
                          register={register("contact", {
                            required: "Contact is required",
                          })}
                          error={errors.contact?.message}
                        />
                      </div>
                      <div className="w-1/2">
                        <TextInput
                          label="Location"
                          placeholder="City, Country"
                          register={register("location", {
                            required: "Location is required",
                          })}
                          error={errors.location?.message}
                        />
                      </div>
                    </div>

                    <TextInput
                      label="Headline / Job Title"
                      placeholder="Software Engineer"
                      register={register("jobTitle", {
                        required: "Job Title is required",
                      })}
                      error={errors.jobTitle?.message}
                    />

                    <div className="flex flex-col">
                      <label className="mb-1 text-sm text-gray-600">
                        Professional Summary
                      </label>
                      <textarea
                        className="resize-none rounded-lg border border-gray-300 px-4 py-2 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={4}
                        placeholder="A short summary about your background, strengths and what you're looking for."
                        {...register("about", {
                          required: "Please write a short summary",
                        })}
                      />
                      {errors.about && (
                        <span className="mt-0.5 text-xs text-red-500">
                          {errors.about.message}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <BsStars className="text-blue-600" /> Skills
                      </label>
                      <SkillsEditor skills={skills} setSkills={setSkills} />
                    </div>

                    <div className="flex flex-col">
                      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                        <HiOutlineBriefcase className="text-blue-600" /> Work
                        Experience
                      </label>
                      <ExperienceEditor
                        experience={experience}
                        setExperience={setExperience}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">
                          Profile Picture
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="text-sm"
                          onChange={(e) => setProfileImage(e.target.files[0])}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">
                          Resume (PDF/DOC)
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="text-sm"
                          onChange={(e) => setUploadCv(e.target.files[0])}
                        />
                        {uploadCv ? (
                          <p className="mt-1 text-xs text-green-600">
                            {uploadCv.name} ready to upload
                          </p>
                        ) : (
                          profile?.cvUrl && (
                            <div className="mt-2">
                              <ResumePreview url={profile.cvUrl} compact />
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {errMsg && (
                      <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                        {errMsg}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    {isLoading ? (
                      <div className="px-6">
                        <Loading />
                      </div>
                    ) : (
                      <CustomButton
                        type="submit"
                        title="Save Changes"
                        containerStyles="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      />
                    )}
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

/* -------------------------------------------------------------------------- */
/*  Section wrapper + page                                                    */
/* -------------------------------------------------------------------------- */
const Section = ({ icon, title, action, children }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <span className="text-blue-600">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const UserProfile = () => {
  const account = useSelector((state) => state.user)?.user || {};
  // Tolerate the older nested { user, token } shape that may linger in storage.
  const profile = account?.user
    ? { ...account.user, token: account.token }
    : account;

  const [open, setOpen] = useState(false);
  const { percent, items } = computeProfileCompletion(profile);
  const remaining = items.filter((i) => !i.done);

  const editBtn = (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-600 hover:text-white"
    >
      <FiEdit2 /> Edit
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f7fdfd] py-8 md:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header card */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />
          <div className="px-6 pb-6 md:px-8">
            <div className="-mt-14 flex flex-col items-center gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-end">
                <ProfileRing
                  src={profile?.profileUrl || NoProfile}
                  alt={profile?.firstName}
                  percent={percent}
                  size={128}
                />
                <div className="pb-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {`${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
                      "Your Name"}
                  </h1>
                  <p className="font-medium text-blue-700">
                    {profile?.jobTitle || "Add your headline"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-500 md:justify-start">
                    <span className="flex items-center gap-1">
                      <HiLocationMarker /> {profile?.location || "No location"}
                    </span>
                    <span className="flex items-center gap-1">
                      <AiOutlineMail /> {profile?.email || "No email"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiPhoneCall /> {profile?.contact || "No contact"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="md:pb-2">
                <CustomButton
                  title="Edit Profile"
                  onClick={() => setOpen(true)}
                  iconRight={<FiEdit2 />}
                  containerStyles="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Section
              icon={<HiOutlineDocumentText />}
              title="About"
              action={editBtn}
            >
              {profile?.about ? (
                <p className="whitespace-pre-line leading-7 text-slate-600">
                  {profile.about}
                </p>
              ) : (
                <p className="text-sm text-slate-400">
                  Add a professional summary so recruiters know who you are.
                </p>
              )}
            </Section>

            <Section icon={<BsStars />} title="Skills" action={editBtn}>
              {profile?.skills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Add your top skills to appear in more searches.
                </p>
              )}
            </Section>

            <Section
              icon={<HiOutlineBriefcase />}
              title="Experience"
              action={editBtn}
            >
              {profile?.experience?.length ? (
                <div className="flex flex-col">
                  {profile.experience.map((exp, i) => (
                    <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span className="mt-1 h-3 w-3 rounded-full border-2 border-blue-600 bg-white" />
                        {i < profile.experience.length - 1 && (
                          <span className="w-px flex-1 bg-slate-200" />
                        )}
                      </div>
                      <div className="pb-1">
                        <p className="font-semibold text-slate-900">
                          {exp.title || "Role"}
                          {exp.company && (
                            <span className="font-normal text-slate-500">
                              {" "}
                              · {exp.company}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {fmtMonth(exp.startDate)}
                          {(exp.startDate || exp.endDate || exp.currentlyWorking) &&
                            " – "}
                          {exp.currentlyWorking
                            ? "Present"
                            : fmtMonth(exp.endDate)}
                          {exp.location && ` · ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Add your work history to strengthen your profile.
                </p>
              )}
            </Section>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Completeness card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Profile strength
                </h3>
                <span className="text-sm font-bold text-blue-600">
                  {percent}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {remaining.length > 0 ? (
                <>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Complete your profile
                  </p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {remaining.map((item) => (
                      <li
                        key={item.key}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300" />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setOpen(true)}
                    className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Complete now
                  </button>
                </>
              ) : (
                <p className="mt-4 flex items-center gap-2 text-sm font-medium text-green-600">
                  <FiCheck /> Your profile is all set!
                </p>
              )}
            </div>

            {/* Resume card */}
            <Section
              icon={<HiOutlineDocumentText />}
              title="Resume"
              action={editBtn}
            >
              {profile?.cvUrl ? (
                <ResumePreview url={profile.cvUrl} height={320} />
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                  <HiOutlineDocumentText className="mx-auto text-3xl text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    No resume uploaded yet.
                  </p>
                  <button
                    onClick={() => setOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <FiPlus /> Upload resume
                  </button>
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>

      <UserForm profile={profile} open={open} setOpen={setOpen} />
    </div>
  );
};

export default UserProfile;
