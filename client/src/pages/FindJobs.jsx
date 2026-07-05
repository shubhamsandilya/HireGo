import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BiBriefcaseAlt2, BiChevronDown, BiFilterAlt } from "react-icons/bi";
import { BsStars } from "react-icons/bs";
import { AiOutlineClose } from "react-icons/ai";
import { debounce } from "lodash";

import Header from "../components/Header";
import { experience, jobTypes } from "../utils/data";
import { CustomButton, JobCard, ListBox, Loading } from "../components";
import { apiRequest, updateURL } from "../utils";

const JobCardSkeleton = () => (
  <div className="h-[16rem] w-full animate-pulse rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm md:h-[18rem] md:w-[16rem] 2xl:w-[18rem]">
    <div className="flex gap-3">
      <div className="h-14 w-14 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2 py-2">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 rounded bg-slate-200" />
      <div className="h-3 w-5/6 rounded bg-slate-200" />
      <div className="h-3 w-2/3 rounded bg-slate-200" />
    </div>
    <div className="mt-8 flex justify-between">
      <div className="h-5 w-16 rounded bg-slate-200" />
      <div className="h-4 w-12 rounded bg-slate-200" />
    </div>
  </div>
);

const FindJobs = () => {
  const [sort, setSort] = useState("Newest");
  const [page, setPage] = useState(1);
  const [numPage, setNumPage] = useState(1);
  const [recordCount, setRecordCount] = useState(0);
  const [data, setData] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [filterJobTypes, setFilterJobTypes] = useState([]);
  const [filterExp, setFilterExp] = useState("");
  const [expVal, setExpVal] = useState([]);

  const [isFetching, setIsFetching] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [openSections, setOpenSections] = useState({ type: true, exp: true });

  const location = useLocation();
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    setIsFetching(true);
    const newUrl = updateURL({
      pageNum: page,
      query: searchQuery,
      cmpLoc: jobLocation,
      sort: sort,
      navigate: navigate,
      location: location,
      jType: filterJobTypes,
      exp: filterExp,
    });
    try {
      const res = await apiRequest({ url: "/jobs" + newUrl, method: "GET" });
      setNumPage(res?.numOfPage);
      setRecordCount(res?.totalJobs);
      setData((prev) => (page === 1 ? res?.data : [...prev, ...res?.data]));
      setIsFetching(false);
    } catch (e) {
      setIsFetching(false);
      console.log(e);
    }
  });

  const filterJobs = (val) => {
    if (filterJobTypes?.includes(val)) {
      setFilterJobTypes(filterJobTypes.filter((el) => el != val));
    } else {
      setFilterJobTypes([...filterJobTypes, val]);
    }
  };

  const filterExperience = (e) => {
    if (expVal.includes(e)) {
      setExpVal(expVal?.filter((el) => el != e));
    } else {
      setExpVal([...expVal, e]);
    }
  };

  const clearFilters = () => {
    setFilterJobTypes([]);
    setExpVal([]);
  };

  const handleSearchSubmit = debounce(async (e) => {
    e.preventDefault();
    setPage(1);
    await fetchJobs();
  }, 1000);

  const handleShowMore = async (e) => {
    e.preventDefault();
    setPage((prev) => prev + 1);
  };

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const expTitle = (val) => experience.find((e) => e.value === val)?.title || val;
  const activeCount = filterJobTypes.length + expVal.length;

  useEffect(() => {
    if (!expVal.length) {
      setFilterExp("");
      return;
    }
    const ranges = expVal.flatMap((el) => el.split("-").map(Number));
    ranges.sort((a, b) => a - b);
    setFilterExp(`${ranges[0]}-${ranges[ranges.length - 1]}`);
  }, [expVal]);

  useEffect(() => {
    fetchJobs();
  }, [sort, filterJobTypes, filterExp, page]);

  const showInitialSkeleton = isFetching && page === 1 && data.length === 0;

  // Shared filter UI (used in the desktop sidebar and the mobile drawer).
  // Called as a function — not rendered as <Component/> — so the inputs don't
  // remount on every state change.
  const renderFilters = () => (
    <>
      <div className="py-2">
        <button
          type="button"
          onClick={() => toggleSection("type")}
          className="mb-3 flex w-full items-center justify-between font-semibold text-slate-700"
        >
          <span className="flex items-center gap-2">
            <BiBriefcaseAlt2 /> Job Type
          </span>
          <BiChevronDown
            className={`transition-transform ${
              openSections.type ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.type && (
          <div className="flex flex-col gap-2">
            {jobTypes.map((jtype) => (
              <label
                key={jtype}
                className="flex cursor-pointer items-center gap-2 text-sm md:text-base"
              >
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  value={jtype}
                  checked={filterJobTypes.includes(jtype)}
                  onChange={(e) => filterJobs(e.target.value)}
                />
                <span>{jtype}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 py-2">
        <button
          type="button"
          onClick={() => toggleSection("exp")}
          className="mb-3 flex w-full items-center justify-between font-semibold text-slate-700"
        >
          <span className="flex items-center gap-2">
            <BsStars /> Experience
          </span>
          <BiChevronDown
            className={`transition-transform ${
              openSections.exp ? "rotate-180" : ""
            }`}
          />
        </button>

        {openSections.exp && (
          <div className="flex flex-col gap-2">
            {experience.map((exp) => (
              <label
                key={exp.title}
                className="flex cursor-pointer items-center gap-3 text-sm md:text-base"
              >
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  value={exp.value}
                  checked={expVal.includes(exp.value)}
                  onChange={(e) => filterExperience(e.target.value)}
                />
                <span>{exp.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f7fdfd]">
      <Header
        title="Find Your Dream Job with Ease"
        type="home"
        handleClick={handleSearchSubmit}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        location={jobLocation}
        setLocation={setJobLocation}
      />

      <div className="container mx-auto px-5 py-6 md:px-5">
        {/* Mobile toolbar */}
        <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 rounded-full border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-600"
          >
            <BiFilterAlt /> Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-blue-600 px-1.5 text-xs text-white">
                {activeCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span>Sort By:</span>
            <ListBox sort={sort} setSort={setSort} />
          </div>
        </div>

        <div className="flex gap-6 2xl:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden h-fit w-1/4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:block lg:w-1/5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-700">
                Filter Search
              </p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            {renderFilters()}
          </aside>

          {/* Results */}
          <main className="w-full md:flex-1">
            <div className="mb-4 hidden items-center justify-between md:flex">
              <p className="text-sm md:text-base">
                Showing{" "}
                <span className="font-semibold">{recordCount}</span> jobs
                available
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm md:text-base">Sort By:</p>
                <ListBox sort={sort} setSort={setSort} />
              </div>
            </div>

            <p className="mb-3 text-sm md:hidden">
              Showing <span className="font-semibold">{recordCount}</span> jobs
            </p>

            {/* Active filter chips */}
            {activeCount > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {filterJobTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => filterJobs(t)}
                    className="flex items-center gap-1 rounded-full bg-[#1d4fd826] px-3 py-1 text-xs font-medium text-[#1d4fd8]"
                  >
                    {t} <AiOutlineClose className="text-[10px]" />
                  </button>
                ))}
                {expVal.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => filterExperience(v)}
                    className="flex items-center gap-1 rounded-full bg-[#1d4fd826] px-3 py-1 text-xs font-medium text-[#1d4fd8]"
                  >
                    {expTitle(v)} <AiOutlineClose className="text-[10px]" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4 md:justify-start">
              {showInitialSkeleton &&
                Array.from({ length: 6 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
                ))}

              {!showInitialSkeleton &&
                data?.map((job, index) => {
                  const newJob = {
                    name: job?.company?.name,
                    logo: job?.company?.profileUrl,
                    ...job,
                  };
                  return <JobCard job={newJob} key={job._id || index} />;
                })}
            </div>

            {/* Empty state */}
            {!isFetching && data?.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <BiBriefcaseAlt2 className="text-5xl text-gray-300" />
                <p className="font-semibold text-gray-700">No jobs found</p>
                <p className="max-w-sm text-sm text-gray-500">
                  Try adjusting your search or filters to find more
                  opportunities.
                </p>
                {activeCount > 0 && (
                  <CustomButton
                    title="Clear filters"
                    onClick={clearFilters}
                    containerStyles="mt-1 rounded-full border border-blue-600 px-5 py-1.5 text-sm text-blue-600 hover:bg-blue-700 hover:text-white"
                  />
                )}
              </div>
            )}

            {/* Load-more spinner (pagination) */}
            {isFetching && page > 1 && (
              <div className="py-10">
                <Loading />
              </div>
            )}

            {numPage > page && !isFetching && data.length > 0 && (
              <div className="flex w-full items-center justify-center pt-12">
                <CustomButton
                  title="Load More"
                  onClick={handleShowMore}
                  containerStyles="rounded-full border border-blue-600 px-6 py-1.5 text-base text-blue-600 hover:bg-blue-700 hover:text-white"
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-lg font-semibold text-slate-700">Filters</p>
              <div className="flex items-center gap-4">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  aria-label="Close filters"
                >
                  <AiOutlineClose size={20} />
                </button>
              </div>
            </div>
            {renderFilters()}
            <CustomButton
              title="Show results"
              onClick={() => setShowMobileFilters(false)}
              containerStyles="mt-6 w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FindJobs;
