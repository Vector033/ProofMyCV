"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Marks itself `data-inview` just before it scrolls into view, so CSS can play an
 * entrance on its children (stagger with `style={{ "--i": index }}`).
 * Nothing is ever hidden waiting for it: without JS, with reduced motion, or when it
 * is already on screen at load, the content simply stays as rendered.
 */
export function InView({ as: Tag = "div", className, children }: { as?: ElementType; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: stay still
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px 10% 0px" }, // start a little below the fold, so the switch to frame 0 is never seen
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className} data-inview={inView || undefined}>
      {children}
    </Tag>
  );
}
