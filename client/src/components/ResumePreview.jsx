import { AiOutlineFilePdf, AiOutlineFileText } from "react-icons/ai";
import { FiExternalLink, FiDownload } from "react-icons/fi";

/**
 * Renders an inline preview of an uploaded resume.
 * PDFs are embedded; other document types fall back to a link card.
 */
const ResumePreview = ({ url, height = 380, compact = false }) => {
  if (!url) return null;

  const isPdf = /\.pdf(\?|$)/i.test(url);
  const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "resume");

  const actions = (
    <div className="flex items-center gap-3">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <FiExternalLink /> Open
      </a>
      <a
        href={url}
        download
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <FiDownload /> Download
      </a>
    </div>
  );

  if (compact || !isPdf) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl text-blue-600">
            {isPdf ? <AiOutlineFilePdf /> : <AiOutlineFileText />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">
              {fileName}
            </p>
            <p className="text-xs text-slate-400">Uploaded resume</p>
          </div>
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <AiOutlineFilePdf className="shrink-0 text-lg text-red-500" />
          <p className="truncate text-sm font-medium text-slate-700">
            {fileName}
          </p>
        </div>
        {actions}
      </div>
      <object
        data={`${url}#toolbar=0&navpanes=0`}
        type="application/pdf"
        width="100%"
        height={height}
        aria-label="Resume preview"
      >
        <div className="p-6 text-center text-sm text-slate-500">
          Preview isn&apos;t available here.{" "}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-600 underline"
          >
            Open the resume in a new tab
          </a>
          .
        </div>
      </object>
    </div>
  );
};

export default ResumePreview;
