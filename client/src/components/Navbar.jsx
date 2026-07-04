import  { Fragment,  useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { BiChevronDown } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { HiMenuAlt3 } from "react-icons/hi";
import { AiOutlineClose, AiOutlineLogout } from "react-icons/ai";
import { Link } from "react-router-dom";
import CustomButton from "./CustomButton";
import { useSelector, useDispatch } from "react-redux";
import { Logout } from "../redux/userSlice";

function MenuList({ user, onClick }) {
  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(Logout());
    window.location.replace("/");
  };
  // console.log(user);

  return (
    <div>
      <Menu as="div" className="inline-block text-left">
        <div className="flex">
          <Menu.Button className="flex items-center gap-3 w-full rounded-md md:px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white">
  
  {/* Text */}
  <div className="flex flex-col items-start leading-tight">
    <p className="text-sm font-semibold">
      {user?.user?.firstName ?? user?.user?.name}
    </p>
    <span className="text-xs text-blue-600">
      {user?.jobTitle ?? user?.email}
    </span>
  </div>

  {/* Avatar */}
  <img
    src={
      user?.user?.profileUrl ??
      `https://avatar.iran.liara.run/username?username=${user?.user?.firstName}${user?.user?.lastName}`
    }
    alt="user profile"
    className="w-10 h-10 rounded-full object-cover"
  />

  {/* Arrow */}
  <BiChevronDown className="h-6 w-6 text-slate-600" aria-hidden="true" />
</Menu.Button>

        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute z-50 right-2 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg focus:outline-none ">
            <div className="p-1 ">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to={`${
                      user?.user?.accountType
                        ? "user-profile"
                        : "company-profile"
                    }`}
                    className={`${
                      active ? "bg-blue-500 text-white" : "text-gray-900"
                    } group flex w-full items-center rounded-md p-2 text-sm`}
                    onClick={onClick}
                  >
                    <CgProfile
                      className={`${
                        active ? "text-white" : "text-gray-600"
                      } mr-2 h-5 w-5  `}
                      aria-hidden="true"
                    />
                    {user?.user?.accountType
                      ? "User Profile"
                      : "Company Profile"}
                  </Link>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => handleLogout()}
                    className={`${
                      active ? "bg-blue-500 text-white" : "text-gray-900"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    <AiOutlineLogout
                      className={`${
                        active ? "text-white" : "text-gray-600"
                      } mr-2 h-5 w-5  `}
                      aria-hidden="true"
                    />
                    Log Out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
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
