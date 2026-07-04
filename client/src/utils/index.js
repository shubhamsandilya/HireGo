import axios from "axios";
// Override per environment via client/.env: VITE_API_URL=https://your-backend/api/v1
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800/api/v1";

export const API = axios.create({
  baseURL: API_URL,
  responseType: "json",
});

export const apiRequest = async ({ url, token, data, method }) => {
  try {
    const result = await API(url, {
      method: method || "GET",
      data: data,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return result?.data;
  } catch (error) {
    // Always resolve to a predictable shape so callers never crash.
    // Covers API errors (error.response) AND network/timeouts (no response).
    const err = error?.response?.data;
    console.log(error);
    return {
      status: err?.success ?? "failed",
      message:
        err?.message ??
        "Unable to reach the server. Please check your connection and try again.",
    };
  }
};

export const handleFileUpload = async (uploadFile) => {
  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("upload_preset", "hirego");
  try {
    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/dtcfxjepi/image/upload",
      formData
    );
    return response.data.secure_url;
  } catch (err) {
    console.log(err);
  }
};

export const updateURL = ({
  pageNum,
  query,
  cmpLoc,
  sort,
  navigate,
  location,
  jType,
  exp,
}) => {
  const params = new URLSearchParams();
  if (pageNum && pageNum > 1) {
    params.set("page", pageNum);
  }
  if (query) {
    params.set("search", query);
  }
  if (cmpLoc) {
    params.set("location", cmpLoc);
  }
  if (sort) {
    params.set("sort", sort);
  }
  if (jType) {
    params.set("jtype", jType);
  }
  if (exp) {
    params.set("exp", exp);
  }

  const newURL = `${location.pathname}?${params.toString()}`;
  navigate(newURL, { replace: true });

  return newURL;
};
