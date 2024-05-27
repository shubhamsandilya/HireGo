import { Footer, Navbar } from "./components";
import { Outlet, Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  About,
  AuthPage,
  Companies,
  CompanyProfile,
  FindJobs,
  JobDetail,
  UploadJobs,
  UserProfile,
} from "./pages";
import Apply from "./pages/Apply";
import { useSelector } from "./redux/store";
function Layout() {
  const { user } = useSelector((state) => state.user);
  const location = useLocation();
  return user ? (
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
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<Navigate to="/find-jobs" replace={true} />}
          />
          <Route path="/find-jobs" element={<FindJobs />} />
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
          <Route path="/job-detail/:id" element={<JobDetail />} />
        </Route>
        <Route path="/about-us" element={<About />} />
        <Route path="/user-auth" element={<AuthPage />} />
        <Route path="apply-page/:id" element={<Apply />} />
      </Routes>
      {user && <Footer />}
    </main>
  );
}

export default App;
