"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GrainGradient } from "@paper-design/shaders-react";

let webglSupportedCache: boolean | null = null;

function checkWebGLSupport(): boolean {
  if (typeof document === "undefined") return false;
  if (webglSupportedCache !== null) return webglSupportedCache;
  try {
    const canvas = document.createElement("canvas");
    webglSupportedCache = Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
    );
  } catch {
    webglSupportedCache = false;
  }
  return webglSupportedCache;
}

const noopSubscribe = () => () => {};

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * GPU-accelerated Hero background shader using FactFit's Slate & Emerald palette.
 * Enforces Section 6.2 guardrails:
 * - Instant --canvas (#f8fafc) CSS fallback during SSR (zero CLS)
 * - Pauses via speed={0} when prefers-reduced-motion is enabled
 * - Pauses via IntersectionObserver when scrolled out of viewport
 * - Radial fade mask + soft contrast scrim preserving >= 4.5:1 WCAG AA text contrast
 */
export function HeroShader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  const webglReady = useSyncExternalStore(noopSubscribe, checkWebGLSupport, () => false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const activeSpeed = reducedMotion || !isVisible ? 0 : 0.25;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[var(--canvas)]"
    >
      {/* Masked GPU Fragment Shader Layer */}
      {webglReady && (
        <div
          className="absolute inset-0 opacity-35"
          style={{
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        >
          <GrainGradient
            colorBack="#f8fafc"
            colors={["#f8fafc", "#e2e8f0", "#d1fae5", "#047857"]}
            softness={0.65}
            intensity={0.18}
            noise={0.22}
            shape="corners"
            speed={activeSpeed}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}

      {/* Soft contrast scrim behind hero copy so Slate-800/600 typography stays >= 4.5:1 WCAG AA */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 68% 52% at 50% 24%, rgb(248 250 252 / 0.78), transparent 85%)",
        }}
      />
    </div>
  );
}
