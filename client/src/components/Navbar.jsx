import { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { BiChevronDown } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { HiMenuAlt3 } from "react-icons/hi";
import { AiOutlineClose, AiOutlineLogout } from "react-icons/ai";
import { FiFileText, FiBriefcase } from "react-icons/fi";
import { Link } from "react-router-dom";
import CustomButton from "./CustomButton";
import ProfileRing from "./ProfileRing";
import { useSelector, useDispatch } from "react-redux";
import { Logout } from "../redux/userSlice";
import { avatarUrl, computeProfileCompletion } from "../utils";
import { NoProfile } from "../assets";

function MenuList({ user, onClick }) {
  const dispatch = useDispatch();
  const account = user?.user || {};
  const isSeeker = account?.accountType === "seeker";

  const displayName = account?.firstName
    ? `${account.firstName} ${account.lastName || ""}`.trim()
    : account?.name || "Your account";
  const subtitle = account?.jobTitle || account?.email || "";
  const avatar = avatarUrl(account);
  // Completion only makes sense for a seeker profile.
  const { percent } = isSeeker
    ? computeProfileCompletion(account)
    : { percent: null };

  const profilePath = isSeeker ? "/user-profile" : "/company-profile";

  const handleLogout = () => {
    dispatch(Logout());
    window.location.replace("/");
  };

  const itemCls = (active) =>
    `${
      active ? "bg-blue-50 text-blue-700" : "text-slate-700"
    } group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm`;

  return (
    <Menu as="div" className="relative inline-block text-left">
      {/* Trigger: avatar wrapped in a completion ring (green as it fills) */}
      <Menu.Button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white">
        {isSeeker ? (
          <ProfileRing
            src={avatar}
            percent={percent}
            size={40}
            stroke={3}
            showBadge={false}
          />
        ) : (
          <img
            src={avatar}
            alt={displayName}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = NoProfile;
            }}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-100"
          />
        )}

        <span className="hidden flex-col items-start leading-tight md:flex">
          <span className="max-w-[9rem] truncate text-sm font-semibold text-slate-800">
            {displayName}
          </span>
          {subtitle && (
            <span className="max-w-[9rem] truncate text-xs text-blue-600">
              {subtitle}
            </span>
          )}
        </span>

        <BiChevronDown className="h-5 w-5 text-slate-500" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-100 bg-white p-2 shadow-lg focus:outline-none">
          {/* Identity header */}
          <div className="flex items-center gap-3 px-2 py-2">
            <img
              src={avatar}
              alt={displayName}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = NoProfile;
              }}
              className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>
              {account?.email && (
                <p className="truncate text-xs text-slate-500">
                  {account.email}
                </p>
              )}
              <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                {isSeeker ? "Job Seeker" : "Company"}
              </span>
            </div>
          </div>

          {/* Profile strength (seekers only) */}
          {isSeeker && (
            <div className="px-2 pb-1 pt-1">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-500">Profile strength</span>
                <span className="font-semibold text-slate-700">{percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-green-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          <div className="my-1.5 h-px bg-slate-100" />

          <Menu.Item>
            {({ active }) => (
              <Link
                to={profilePath}
                onClick={onClick}
                className={itemCls(active)}
              >
                <CgProfile className="h-4 w-4" aria-hidden="true" />
                {isSeeker ? "My Profile" : "Company Profile"}
              </Link>
            )}
          </Menu.Item>

          {isSeeker ? (
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/apply-history"
                  onClick={onClick}
                  className={itemCls(active)}
                >
                  <FiFileText className="h-4 w-4" aria-hidden="true" />
                  My Applications
                </Link>
              )}
            </Menu.Item>
          ) : (
            <Menu.Item>
              {({ active }) => (
                <Link
                  to="/my-openings"
                  onClick={onClick}
                  className={itemCls(active)}
                >
                  <FiBriefcase className="h-4 w-4" aria-hidden="true" />
                  My Openings
                </Link>
              )}
            </Menu.Item>
          )}

          <div className="my-1.5 h-px bg-slate-100" />

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleLogout}
                className={`${
                  active ? "bg-red-50 text-red-600" : "text-slate-700"
                } group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm`}
              >
                <AiOutlineLogout className="h-4 w-4" aria-hidden="true" />
                Log Out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
const Navbar = () => {
  const user = useSelector((state) => state.user);

  const isLoggedIn = Boolean(user?.user?.token);
const accountType = user?.user?.accountType; // "seeker" | "company" | undefined
const isSeeker = accountType === "seeker";
const isCompany = accountType === "company";

  const navLinks = [
  { label: "Find Job", to: "/" },
  { label: "Companies", to: "/companies" },
  { label: "About", to: "/about-us" },
];

  const roleLinks = () => {
  if (!isLoggedIn) return [];

  if (isSeeker) {
    return [{ label: "Applications", to: "/apply-history" }];
  }

  if (isCompany) {
    return [
      { label: "Upload Job", to: "/upload-job" },
      { label: "My Openings", to: "/my-openings" },
    ];
  }

  return [];
};

  const [isOpen, setIsOpen] = useState(false);
  // console.log(user);
 const handleCloseNavbar = () => {
  setIsOpen(false);
};


  return (
    <>
      <div className="relative bg-[#f7fdfd] z-50">
        <nav className="container mx-auto flex items-center justify-between p-5">
          <div>
            <Link to="/" className="text-blue-600 font-bold text-xl">
              Hire<span className="text-[#1677cccb]">Go</span>
            </Link>
          </div>

          <ul className="hidden lg:flex gap-10 text-base">
  {[...navLinks, ...roleLinks()].map((item) => (
    <li key={item.to}>
      <Link to={item.to}>{item.label}</Link>
    </li>
  ))}
</ul>

          {/* {console.log(user.user.token)} */}
          <div className="hidden lg:block">
  {!isLoggedIn ? (
    <Link to="/user-auth">
      <CustomButton
        title="Sign In"
        containerStyles="text-blue-600 py-1.5 px-5 hover:bg-blue-700 hover:text-white rounded-full border border-blue-600"
      />
    </Link>
  ) : (
    <MenuList user={user} />
  )}
</div>


          <button
            className="block lg:hidden text-slate-900"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? <AiOutlineClose size={26} /> : <HiMenuAlt3 size={26} />}
          </button>
        </nav>

        {/* MOBILE MENU */}
        <div
  className={`${
    isOpen ? "absolute flex bg-[#f7fdfd]" : "hidden"
  } container mx-auto lg:hidden flex-col pl-8 gap-3 py-5`}
>
  {[...navLinks, ...roleLinks()].map((item) => (
    <Link key={item.to} to={item.to} onClick={handleCloseNavbar}>
      {item.label}
    </Link>
  ))}

  <div className="w-full py-10">
    {!isLoggedIn ? (
      <Link to="/user-auth" onClick={handleCloseNavbar}>
        <CustomButton
          title="Sign In"
          containerStyles="text-blue-600 py-1.5 px-5 hover:bg-blue-700 hover:text-white rounded-full border border-blue-600"
        />
      </Link>
    ) : (
      <MenuList user={user} onClick={handleCloseNavbar} />
    )}
  </div>
</div>

      </div>
    </>
  );
};

export default Navbar;
