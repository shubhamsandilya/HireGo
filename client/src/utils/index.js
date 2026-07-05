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

// --- Streaming (Server-Sent Events) -----------------------------------------
// Why NOT apiRequest/axios? axios buffers the whole response before it resolves,
// so it can't hand you tokens as they arrive. Browser streaming needs the native
// fetch() + response.body.getReader(), which exposes bytes the moment they land.
//
// Calls onEvent(eventName, data) for every SSE message the server sends:
// "sources" (array), "token" (string), "done" ({}), or "error" ({message}).
// Resolves when the stream closes. Pass a `signal` (AbortController) to cancel.
export const askJobStream = async ({
  jobId,
  question,
  history,
  token,
  onEvent,
  signal,
}) => {
  const res = await fetch(`${API_URL}/ai/ask/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    // history = prior turns so the bot can follow up ("what about remote ones?").
    body: JSON.stringify({ jobId, question, history }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Request failed (${res.status})`);
  }

  // A stream is raw bytes; TextDecoder turns each byte chunk back into text.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = ""; // received text not yet split into complete events

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line ("\n\n"). One network chunk may
    // hold several events — or half of one — so we split and keep the leftover
    // (possibly partial) piece in the buffer for the next read.
    const parts = buffer.split("\n\n");
    buffer = parts.pop(); // last item is incomplete until more bytes arrive

    for (const part of parts) {
      if (!part.trim()) continue;

      // Each event looks like: "event: token" then "data: <json>".
      let event = "message";
      let dataStr = "";
      for (const line of part.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }

      let data = dataStr;
      try {
        data = JSON.parse(dataStr); // string for tokens, array for sources
      } catch {
        /* leave as raw string if it isn't valid JSON */
      }
      onEvent(event, data);
    }
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

// --- Profile completion -----------------------------------------------------
// A single source of truth for "how complete is this seeker's profile", used
// by the profile page ring and the apply-page suggestion.
const hasValue = (v) =>
  Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());

export const profileChecklist = (user) => [
  { key: "photo", label: "Add a profile photo", done: hasValue(user?.profileUrl) },
  { key: "jobTitle", label: "Add your headline / job title", done: hasValue(user?.jobTitle) },
  { key: "location", label: "Add your location", done: hasValue(user?.location) },
  { key: "contact", label: "Add a contact number", done: hasValue(user?.contact) },
  { key: "about", label: "Write a professional summary", done: hasValue(user?.about) },
  { key: "skills", label: "Add at least 3 skills", done: (user?.skills?.length || 0) >= 3 },
  { key: "experience", label: "Add work experience", done: hasValue(user?.experience) },
  { key: "cv", label: "Upload your resume", done: hasValue(user?.cvUrl) },
];

export const computeProfileCompletion = (user) => {
  const items = profileChecklist(user);
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  return { percent, items, done, total: items.length };
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
