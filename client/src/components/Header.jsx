import { AiOutlineSearch, AiOutlineCloseCircle } from "react-icons/ai";
import { CiLocationOn } from "react-icons/ci";
import { HiOutlineBadgeCheck } from "react-icons/hi";
import { FiTrendingUp } from "react-icons/fi";
import CustomButton from "./CustomButton";
import { popularSearch } from "../utils/data";
import { HeroImage, Google, Spotify, Linkedin, Youtube, Facebook } from "../assets";

const SearchInput = ({ placeholder, icon, value, setValue, ariaLabel }) => {
  const clearInput = () => setValue("");

  return (
    <div className="flex flex-1 items-center gap-2 px-3">
      <span className="text-xl text-blue-600">{icon}</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="text"
        aria-label={ariaLabel}
        className="w-full bg-transparent py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none md:text-base"
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={clearInput}
          aria-label="Clear input"
          className="text-gray-400 transition hover:text-gray-600"
        >
          <AiOutlineCloseCircle className="text-lg" />
        </button>
      )}
    </div>
  );
};

const Header = ({
  title,
  type,
  handleClick,
  searchQuery,
  setSearchQuery,
  location,
  setLocation,
}) => {
  const isHome = type === "home";

  // Highlight the phrase starting at "Dream" with a brand gradient, while
  // rendering any other title verbatim (safe fallback for arbitrary titles).
  const renderTitle = () => {
    const idx = title?.toLowerCase().indexOf("dream") ?? -1;
    if (idx < 0) return title;
    return (
      <>
        {title.slice(0, idx)}
        <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
          {title.slice(idx)}
        </span>
      </>
    );
  };

  const stats = [
    { value: "12K+", label: "Live Jobs" },
    { value: "8K+", label: "Companies" },
    { value: "5M+", label: "Candidates" },
  ];

  const trustedLogos = [Google, Linkedin, Spotify, Youtube, Facebook];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#eef4ff] via-[#f5faff] to-[#f7fdfd]">
      {/* Decorative blurred accents */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="container relative mx-auto px-5 py-14 md:py-20 lg:px-0">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left — copy + search */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-blue-700 shadow-sm backdrop-blur md:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
              </span>
              {isHome
                ? "Over 10,000 new jobs added this week"
                : "Explore 5,000+ verified companies"}
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              {renderTitle()}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg lg:mx-0">
              {isHome
                ? "Browse thousands of full-time, remote, and contract roles from the world's leading companies — and apply in just one click."
                : "Discover the companies building the future and find a workplace where you'll truly thrive."}
            </p>

            {/* Unified search bar */}
            <form
              onSubmit={(e) => {
                // Stop the native submit synchronously — handleClick is
                // debounced, so its own preventDefault fires too late to
                // block the page reload (which would drop the search query).
                e.preventDefault();
                handleClick(e);
              }}
              className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-blue-900/5 ring-1 ring-black/5 sm:flex-row sm:items-center lg:mx-0"
            >
              <SearchInput
                placeholder="Job title or keywords"
                ariaLabel="Job title or keywords"
                icon={<AiOutlineSearch />}
                value={searchQuery}
                setValue={setSearchQuery}
              />
              <div className="hidden h-8 w-px bg-gray-200 sm:block" />
              <SearchInput
                placeholder="City or country"
                ariaLabel="Location"
                icon={<CiLocationOn />}
                value={location}
                setValue={setLocation}
              />
              <CustomButton
                type="submit"
                title="Search"
                containerStyles="w-full sm:w-auto justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-blue-800"
              />
            </form>

            {/* Popular searches */}
            {isHome && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="text-sm font-medium text-slate-500">
                  Popular:
                </span>
                {popularSearch.slice(0, 5).map((search) => (
                  <button
                    key={search}
                    type="button"
                    onClick={() => setSearchQuery(search)}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:text-sm"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* Stats */}
            {isHome && (
              <div className="mt-10 flex items-center justify-center gap-8 lg:justify-start">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-slate-900 md:text-3xl">
                      {s.value}
                    </p>
                    <p className="text-xs font-medium text-slate-500 md:text-sm">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — hero image with floating cards */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-blue-600/10 via-cyan-400/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl shadow-blue-900/10 ring-1 ring-black/5">
              <img
                src={HeroImage}
                alt="People finding jobs"
                className="h-[26rem] w-full rounded-3xl object-cover"
              />
            </div>

            <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600">
                <HiOutlineBadgeCheck className="text-2xl" />
              </span>
              <div>
                <p className="text-lg font-bold leading-none text-slate-900">
                  5,000+
                </p>
                <p className="text-xs text-slate-500">Successful hires</p>
              </div>
            </div>

            <div className="absolute -right-4 top-8 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <FiTrendingUp className="text-2xl" />
              </span>
              <div>
                <p className="text-lg font-bold leading-none text-slate-900">
                  98%
                </p>
                <p className="text-xs text-slate-500">Match accuracy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted-by logo strip */}
        {isHome && (
          <div className="mt-16 border-t border-slate-200/70 pt-8">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
              Trusted by teams at leading companies
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {trustedLogos.map((logo, i) => (
                <img
                  key={i}
                  src={logo}
                  alt="Company logo"
                  className="h-7 w-auto opacity-50 grayscale transition hover:opacity-100 hover:grayscale-0 md:h-8"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Header;
