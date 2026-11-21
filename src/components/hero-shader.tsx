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
 * GPU-accelerated Hero background shader using ProofMyCV's Slate & Emerald palette.
 * Enforces Section 6.2 guardrails:
 * - Instant --canvas (#f8fafc) CSS fallback during SSR (zero CLS)
 * - Pauses via speed={0} when prefers-reduced-motion is enabled
 * - Pauses via IntersectionObserver when scrolled out of viewport
 * - Radial fade mask + focused text scrim preserving >= 4.5:1 WCAG AA text contrast
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
      {/* Masked GPU Fragment Shader Layer: visible Slate & Emerald grain */}
      {webglReady && (
        <div
          className="absolute inset-0 opacity-60 sm:opacity-75"
          style={{
            WebkitMaskImage: "radial-gradient(ellipse 90% 85% at 50% 45%, black 52%, transparent 96%)",
            maskImage: "radial-gradient(ellipse 90% 85% at 50% 45%, black 52%, transparent 96%)",
          }}
        >
          <GrainGradient
            colorBack="#f8fafc"
            colors={["#e2e8f0", "#cbd5e1", "#a7f3d0", "#047857"]}
            softness={0.55}
            intensity={0.38}
            noise={0.28}
            shape="corners"
            speed={activeSpeed}
            // A soft backdrop does not need retina resolution; cap the drawn pixels for phones and laptops.
            maxPixelCount={1600 * 1000}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}

      {/* Focused contrast scrim behind hero headline/copy only so Slate-800/600 stays >= 4.5:1 WCAG AA */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 56% 34% at 50% 18%, rgb(248 250 252 / 0.68), transparent 82%)",
        }}
      />
    </div>
  );
}
