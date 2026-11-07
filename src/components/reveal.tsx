"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Staggers its direct children in when they scroll into view. Server HTML is fully
 * visible; only a list that starts below the fold is hidden, so nothing flashes and
 * nothing depends on JS to be readable. Native scroll is untouched.
 * Children should set `style={{ "--i": index }}` for the stagger.
 */
export function Reveal({ as: Tag = "div", className, children }: { as?: ElementType; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "pending" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return; // already on screen
    setState("pending");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className} data-reveal={state === "idle" ? undefined : state}>
      {children}
    </Tag>
  );
}
