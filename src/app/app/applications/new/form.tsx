"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CAREER_TRACKS } from "@/lib/core/jd";
import {
  createApplicationAction,
  fetchJobLinkAction,
  readPosterAction,
  type FormState,
  type JobSourceState,
} from "../../actions";

type Source = "text" | "link" | "image";
const SOURCES: { id: Source; label: string }[] = [
  { id: "text", label: "Paste text" },
  { id: "link", label: "Paste a link" },
  { id: "image", label: "Image or screenshot" },
];

export function NewApplicationForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createApplicationAction, {});
  const v = state.values ?? {};
  const [source, setSource] = useState<Source>("text");
  // Controlled, so a link or a poster can fill them, and an error does not wipe them.
  const [company, setCompany] = useState(v.company ?? "");
  const [role, setRole] = useState(v.role ?? "");
  const [jd, setJd] = useState(v.jdText ?? "");
  const [track, setTrack] = useState(v.track ?? "");
  const [filledFrom, setFilledFrom] = useState<string>();

  // A link or a poster gives text; it lands in the text tab for the user to check.
  const fill = (r: JobSourceState, from: string) => {
    if (!r.text) return;
    setJd(r.text);
    if (r.company && !company) setCompany(r.company);
    if (r.role && !role) setRole(r.role);
    setFilledFrom(from);
    setSource("text");
  };

  return (
    <div className="card p-5">
      {/* Container rounded-lg (8px) with p-1 (4px), so the tabs are rounded (4px). */}
      <div role="group" aria-label="Where the job description comes from" className="flex flex-wrap rounded-lg border border-slate-200 bg-slate-50 p-1">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={source === s.id}
            onClick={() => setSource(s.id)}
            className={`press min-h-11 flex-1 rounded px-3 text-sm font-medium transition-colors duration-150 md:min-h-9 ${
              source === s.id ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {source === "link" && <LinkSource onText={(r) => fill(r, "the link")} />}
      {source === "image" && <ImageSource onText={(r) => fill(r, "the image")} />}

      <form action={action} hidden={source !== "text"} className="mt-5 space-y-4">
        {filledFrom && (
          <p role="status" className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Text read from {filledFrom}. Check it, fix anything that came out wrong, then analyse.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Company (optional)</span>
            <input name="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Lanna Logistics" className="input" />
          </label>
          <label className="block">
            <span className="label">Role (optional, read from the posting if empty)</span>
            <input name="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software Engineering Intern" className="input" />
          </label>
        </div>

        <fieldset>
          <legend className="label">Your track (optional)</legend>
          <p className="hint mt-0 mb-2">For postings that cover several tracks: skills for the other tracks count as nice to have.</p>
          <input type="hidden" name="track" value={track} />
          <div role="group" aria-label="Career track" className="flex flex-wrap gap-2">
            {CAREER_TRACKS.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={track === t}
                onClick={() => setTrack(track === t ? "" : t)}
                className={`press inline-flex min-h-11 items-center rounded-full border px-3 text-sm md:min-h-8 ${
                  track === t ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="label">Job description</span>
          <textarea
            name="jdText"
            required
            minLength={80}
            rows={16}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the whole posting: responsibilities, requirements and nice-to-haves."
            aria-describedby="jd-hint"
            className="input leading-relaxed"
          />
          <span id="jd-hint" className="hint">
            At least a few lines (80+ characters). The more of the posting you paste, the better the match.
          </span>
        </label>
        {state.error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {state.error}
          </p>
        )}
        <button disabled={pending} className="btn-primary">
          {pending ? "Analysing the posting…" : "Analyse job"}
        </button>
      </form>
    </div>
  );
}

/** Calls onText once per new result from a source action. */
function useResult(state: JobSourceState, onText: (r: JobSourceState) => void) {
  const seen = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (state.nonce && state.nonce !== seen.current) {
      seen.current = state.nonce;
      onText(state);
    }
  }, [state, onText]);
}

function LinkSource({ onText }: { onText: (r: JobSourceState) => void }) {
  const [state, action, pending] = useActionState<JobSourceState, FormData>(fetchJobLinkAction, {});
  const [url, setUrl] = useState(""); // controlled: React resets forms after an action, which would drop the link on an error
  useResult(state, onText);
  return (
    <form action={action} className="mt-5 space-y-3">
      <label className="block">
        <span className="label">Link to the job posting</span>
        <input name="url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://careers.example.com/jobs/backend-intern" className="input" />
        <span className="hint">Company career pages work best. LinkedIn and Facebook need a login, so use a screenshot for those.</span>
      </label>
      {state.error && !pending && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn">
        {pending ? "Reading the page…" : "Read page"}
      </button>
    </form>
  );
}

function ImageSource({ onText }: { onText: (r: JobSourceState) => void }) {
  const [state, action, pending] = useActionState<JobSourceState, FormData>(readPosterAction, {});
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useResult(state, onText);

  // Ctrl+V a screenshot anywhere in this panel: it goes into the file input and is read straight away.
  const onPaste = (e: React.ClipboardEvent) => {
    const image = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
    if (!image || !input.current) return;
    e.preventDefault();
    const dt = new DataTransfer();
    dt.items.add(image);
    input.current.files = dt.files;
    form.current?.requestSubmit();
  };

  return (
    <form ref={form} action={action} onPaste={onPaste} className="mt-5 space-y-3">
      <label className="block">
        <span className="label">Poster or screenshot (PNG, JPEG or WebP, up to 2.5 MB)</span>
        <input
          ref={input}
          type="file"
          name="poster"
          required
          accept="image/png,image/jpeg,image/webp"
          className="input file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-sm file:text-slate-700"
        />
        <span className="hint">Or press Ctrl+V here to paste a screenshot. The AI copies the text out; the image is not stored.</span>
      </label>
      {state.error && !pending && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn">
        {pending ? "Reading the image…" : "Read image"}
      </button>
    </form>
  );
}
