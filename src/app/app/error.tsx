"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card p-6">
      <h2 className="font-medium">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-600">
        Check what you entered and try again. If it keeps happening, reload the page.
      </p>
      {error.digest && <p className="mt-1 font-mono text-xs text-slate-400">ref {error.digest}</p>}
      <button onClick={reset} className="btn mt-4">
        Try again
      </button>
    </div>
  );
}
