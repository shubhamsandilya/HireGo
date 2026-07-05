import { Footer, Navbar, SignUp, Chat } from "./components";
import { Outlet, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  About,
  Companies,
  CompanyProfile,
  FindJobs,
  JobDetail,
  UploadJobs,
  UserProfile,
  ApplyHistory,
  YourOpenings,
  // Applicants,
} from "./pages";

import Applicants from "./pages/Applicants";
import Apply from "./pages/Apply";
import { useSelector } from "./redux/store";
function Layout() {
  const { user } = useSelector((state) => state.user);
  const location = useLocation();
  return user?.token ? (
    <Outlet />
  ) : (
    <Navigate to="user-auth" state={{ from: location }} replace />
  );
}
function App() {
  const { user } = useSelector((state) => state.user);
  return (
    <main>
      <Navbar />
      <Routes>
        {/* Public — guests can browse jobs, but not apply */}
        <Route path="/" element={<Navigate to="/find-jobs" replace={true} />} />
        <Route path="/find-jobs" element={<FindJobs />} />
        <Route path="/job-detail/:id" element={<JobDetail />} />
        <Route path="/about-us" element={<About />} />
        <Route path="/user-auth" element={<SignUp />} />

        {/* Auth-gated — everything that acts on a user's account */}
        <Route element={<Layout />}>
          <Route path="/companies" element={<Companies />} />
          <Route
            path={
              user?.accountType === "seeker"
                ? "/user-profile"
                : "/user-profile/:id"
            }
            element={<UserProfile />}
          />
          <Route path="/company-profile" element={<CompanyProfile />} />
          <Route path="/company-profile/:id" element={<CompanyProfile />} />
          <Route path="/upload-job" element={<UploadJobs />} />
          <Route path="/apply-page/:id" element={<Apply />} />
          <Route path="/apply-history" element={<ApplyHistory />} />
          <Route path="/applicants/:jobId" element={<Applicants />} />
          <Route path="/my-openings" element={<YourOpenings />} />
        </Route>
      </Routes>
      {user?.token && <Footer />}
      {/* Global assistant — appears on every page; becomes job-aware on
          /job-detail/:id by reading the URL inside the component. */}
      {user?.token && <Chat />}
    </main>
  );
}

export default App;
