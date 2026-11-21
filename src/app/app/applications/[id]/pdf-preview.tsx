"use client";

import { useRef, useState } from "react";

/** The exported PDF in a dialog, with Education moved to the top for students. */
export function PdfPreview({ href }: { href: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [educationFirst, setEducationFirst] = useState(false);
  // Rendered on each open, not on page load: a save since then must show, and an unopened preview costs nothing.
  const [opens, setOpens] = useState(0);
  const src = educationFirst ? `${href}?education=first` : href;

  return (
    <>
      <button type="button" className="btn min-h-11" onClick={() => {
            setOpens((n) => n + 1);
            dialog.current?.showModal();
          }}
        >
        Preview
      </button>
      <dialog
        ref={dialog}
        aria-label="PDF preview"
        className="m-auto h-[min(90vh,1100px)] w-[min(56rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/50"
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
            <h2 className="mr-auto font-medium">PDF preview</h2>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-700 md:min-h-8">
              <input
                type="checkbox"
                checked={educationFirst}
                onChange={(e) => setEducationFirst(e.target.checked)}
                className="size-4 accent-slate-900"
              />
              Education first
            </label>
            <a href={src} target="_blank" rel="noreferrer" className="btn-primary">
              Open PDF
            </a>
            <button type="button" className="btn" onClick={() => dialog.current?.close()}>
              Close
            </button>
          </div>
          {/* Phones often cannot show a PDF inside a page; "Open PDF" works everywhere. */}
          {opens > 0 && (
            <iframe key={`${src}#${opens}`} src={src} title="Your resume as a PDF" className="min-h-0 w-full flex-1 bg-slate-100" />
          )}
        </div>
      </dialog>
    </>
  );
}
