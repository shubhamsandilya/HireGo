import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { BsStars, BsSend, BsChatDotsFill } from "react-icons/bs";
import { FiExternalLink, FiX } from "react-icons/fi";

import { askJobStream } from "../utils";

// Starter prompts differ by context: on a job page they're about "this job";
// everywhere else they're about the whole platform.
const JOB_SUGGESTIONS = [
  "What skills does this role need?",
  "Is this a senior-level role?",
  "Suggest similar roles for me",
];
const GLOBAL_SUGGESTIONS = [
  "Find remote React jobs",
  "Recommend jobs for me",
  "How do I apply?",
];

const Chat = ({ jobId: jobIdProp }) => {
  // Same token source the rest of the app uses (state.user.user.token).
  const user = useSelector((state) => state.user)?.user;
  const token = user?.token;

  // Mounted globally, so detect whether we're on a job page (/job-detail/:id).
  // If so, the bot gets that job as focal context; otherwise it's global.
  const location = useLocation();
  const jobId =
    jobIdProp || location.pathname.match(/^\/job-detail\/([^/]+)/)?.[1] || null;

  const suggestions = jobId ? JOB_SUGGESTIONS : GLOBAL_SUGGESTIONS;
  const title = jobId ? "Ask about this job" : "HireGo Assistant";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // {role, content, sources?}
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const abortRef = useRef(null);

  // Keep the newest message in view as the answer grows token-by-token
  // (and when the panel is (re)opened).
  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  // If the user navigates away mid-answer, cancel the in-flight stream.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Immutably patch the LAST assistant bubble (the one being typed into).
  const patchLastAssistant = (patch) =>
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "assistant") {
          next[i] = { ...next[i], ...patch(next[i]) };
          break;
        }
      }
      return next;
    });

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || streaming) return;

    // Snapshot prior turns as memory BEFORE we append this one.
    const history = messages
      .filter((m) => m.content?.trim())
      .map((m) => ({ role: m.role, content: m.content }));

    setInput("");
    setStreaming(true);
    // Add the user's message + an empty assistant bubble to fill as tokens land.
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "", sources: [] },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await askJobStream({
        jobId,
        question,
        history,
        token,
        signal: controller.signal,
        onEvent: (event, data) => {
          if (event === "sources") {
            patchLastAssistant(() => ({ sources: data }));
          } else if (event === "token") {
            // append each chunk → this is the "typing" effect
            patchLastAssistant((m) => ({ content: m.content + data }));
          } else if (event === "error") {
            patchLastAssistant((m) => ({
              content:
                m.content || "Sorry, something went wrong. Please try again.",
            }));
          }
          // "done" needs no work — the finally block turns streaming off.
        },
      });
    } catch (err) {
      if (err?.name !== "AbortError") {
        patchLastAssistant((m) => ({
          content: m.content || "Couldn't reach the assistant. Please try again.",
        }));
      }
    } finally {
      setStreaming(false);
    }
  };

  return (
    // Fixed to the bottom-right corner. Panel stacks ABOVE the button.
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 flex h-[70vh] max-h-[560px] w-[90vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-blue-100 bg-gradient-to-br from-blue-50/70 to-white px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                <BsStars className="text-sm" />
              </span>
              {title}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-slate-400 hover:text-slate-600"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {!token ? (
              <div className="text-sm text-slate-600">
                <Link
                  to="/user-auth"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to ask the AI assistant about this job.
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="text-sm text-slate-500">
                    <p className="mb-3">
                      {jobId
                        ? "Ask anything about this role — I only answer from real HireGo data."
                        : "Ask me about jobs on HireGo or how the platform works — I only answer from real data."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user" ? "flex justify-end" : "flex justify-start"
                    }
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-blue-600 text-white"
                          : "border border-slate-100 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {m.content}
                        {/* Blinking cursor while the last bubble is still typing */}
                        {m.role === "assistant" &&
                          streaming &&
                          i === messages.length - 1 && (
                            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-slate-400 align-middle" />
                          )}
                      </p>

                      {/* Source chips — which jobs the answer came from */}
                      {m.role === "assistant" && m.sources?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
                          {m.sources.map((s) => (
                            <Link
                              key={s._id}
                              to={`/job-detail/${s._id}`}
                              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-500 hover:text-blue-600"
                            >
                              <FiExternalLink className="text-[10px]" /> {s.jobTitle}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Input */}
          {token && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-blue-100 px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                disabled={streaming}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <BsSend className="text-sm" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Floating circle toggle — pulses to grab attention while closed */}
      <div className="relative">
        {!open && (
          <>
            {/* radar ring that scales out and fades */}
            <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400 opacity-70" />
            {/* soft breathing glow behind the button */}
            <span className="absolute -inset-1 animate-pulse rounded-full bg-blue-500/30 blur-md" />
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close chat" : "Ask about this job"}
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
        >
          {open ? (
            <FiX className="text-2xl" />
          ) : (
            <BsChatDotsFill className="text-xl" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Chat;
