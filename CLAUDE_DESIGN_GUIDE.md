# CLAUDE_DESIGN_GUIDE: Modern Web Design, Motion System & Psychological Framework (FactFit Edition)

> Master UI/UX and Motion Design System for Claude Code / Claude Chat.
> Synthesized from 6 World-Class Design Masterclasses and Behavioral Psychology Frameworks (Apple, Stripe, byCrawford, Scrollcraft, MotionSites).

---

## 1. Synthesis of the 6 Design Masterclasses & Psychology

### 1.1 The Psychological Foundations of Premium Websites (Sam Crawford)
1. **The 50ms Halo Effect (First Impressions):**
   * Users decide if a web product is credible within **50 milliseconds**.
   * A clean hero section with crisp typography, intentional spacing, and restrained accents creates an instant "positive halo." Users subconsciously assume the code, the AI models, and the reliability of the business are world-class.
2. **Cognitive Fluency & Cognitive Load (Luxury Whitespace Strategy):**
   * Ease of processing = trust. The human brain interprets visual clutter as danger or low quality.
   * Emulate Apple, Stripe, and Figma: use generous negative space, clear visual hierarchy, single primary action per view, and zero decorative noise.
3. **Micro-Interactions & The Peak-End Rule:**
   * Users evaluate an entire web application based on two moments: the emotional **Peak** (the coolest interaction) and the **End** (the final confirmation or success state).
   * Engineer satisfying tactile button presses (`active:scale-[0.98]`), subtle status pulses, smooth count-up badges, and celebratory verified states.

### 1.2 Anti-AI Slop & Design System Foundation (Mikey Website)
* **Eliminate Generic AI Aesthetics:** Never output generic purple-to-blue linear gradients, bland 3-card features, or centered untextured text.
* **Tokenized Design System:** Establish explicit Color Tokens (60-30-10 rule), Type Scale, and Spacing Grids before writing component code.
* **Multi-Pass Refinement:** Instruct Claude in focused passes (Layout & Structure -> Texture & Depth -> Motion & Micro-Interactions) to maximize code precision and prevent token exhaustion.

### 1.3 The 3 Core Pillars of Standout Websites (Chris Misterek)
* **The 60-30-10 Color Architecture:**
  * **60% Dominant Canvas:** `#fafaf9` (Stone-50) clean neutral base.
  * **30% Secondary & Structure:** `#1c1917` (Stone-900 typography), `#e7e5e4` (Stone-200 hairline borders), container cards.
  * **10% High-Energy Accent:** `#059669` / `#047857` (Emerald-600/700) reserved exclusively for verified badges, primary CTAs, and active states.
* **Visual Hierarchy:** Deliberate eye flow from Primary Focal Point (Hero value proposition) to Secondary Proof (Interactive Comparison) to Supporting Features.
* **Typography:** High readability, strict scale ratio (1.25 / 1.333), controlled line length (45–65 characters).

### 1.4 Scrollcraft & Scroll as Timeline (Nate Herk)
* **Scroll as the Storytelling Journey:** The landing page is not a passive wall of text; it's a dynamic timeline where content builds as the user moves down.
* **Aesthetic Floor:** 1px hairline borders (`border-stone-200/80`), subtle ambient radial glow, and spring-like easing curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
* **Self-Verification Harness:** Eliminate layout shifts (CLS), dead scroll traps, and responsive overflows.

### 1.5 Purposeful Motion vs Scrolljacking (Sam Crawford)
* **Strict Prohibition of Scrolljacking:** **Never hijack native scroll mechanics or wheel velocity.**
* **Performance Budget:** Animations must use GPU-accelerated CSS properties (`transform` and `opacity` only) to guarantee steady 60 FPS.
* **Accessibility:** Full WCAG AA compliance (contrast ratio ≥ 4.5:1), touch targets ≥ 44×44px, and support for `@media (prefers-reduced-motion)`.

### 1.6 Interactive Prototyping & Motion Libraries (Viktor Oddy)
* **MotionSites.ai & GetDesign.ai Insights:**
  * Build interactive hero demos and tactile UI components without paying for heavy bloated 3rd-party SaaS libraries.
  * Utilize lightweight pure CSS keyframes, SVG progress rings, and React state for interactive interactive before/after split sliders.

---

## 2. Curated Resource Directory (from Masterclass Video Descriptions)

* **Scrollcraft by Nate Herk:** Agentic design skill repository and design floor patterns (`skool.com/ai-automation-society`).
* **byCrawford Premium Website Checklist & System (Sam Crawford):** Principles of cognitive fluency, halo effect engineering, and conversion architecture (`bycrawford.com/premium-website-checklist`).
* **MotionSites.ai & GetDesign.ai (Viktor Oddy):** Curated prompt library for interactive hero sections, 3D card depth, and motion recipes (`motionsites.ai`, `getdesign.ai`).
* **Design Rocket (`designrocket.io`):** Advanced UI motion engineering workflows.

---

## 3. Tailwind CSS v4 & Next.js 16 Motion Recipes for FactFit

Add these high-performance keyframes to `src/app/globals.css`:

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.35);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(5, 150, 105, 0);
  }
}

@keyframes scanBeam {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(220%); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-pulse-glow {
  animation: pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.press-scale {
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.press-scale:active {
  transform: scale(0.97);
}
```

---

## 4. Project-Specific Elevation Blueprint (FactFit)

* **Current State:** Functional resume tailoring system with fabrication guard, but minimalist and text-heavy with standard static boxes.
* **Target Transformation:**
  1. **Hero Split Interactive Showcase:** Side-by-side or tabbed comparison demonstrating:
     * *Unverified AI Resume:* Red warning indicators highlighting made-up metrics (Hallucinations).
     * *FactFit Verified Resume:* Glowing emerald lines connecting each resume bullet point to an exact entry in the user's Fact Bank with a 100% confidence badge.
  2. **Score Badge Counter:** Radial progress SVG circle animating smoothly from 0% to the target match score with spring easing.
  3. **Staggered Cards:** Steps 01, 02, 03 revealing smoothly sequentially on viewport entry.

---

## 5. Token-Efficient English Prompts for Claude (Ready to Copy-Paste)

> **Pro-Tip for Saving Claude Tokens:** English prompts consume ~60% fewer tokens than Thai script in Claude's tokenizer, preventing quota limits while yielding faster, highly precise responses.

### Prompt 1: Landing Page & Hero Interactive Proof Showcase
```text
Task: Elevate the UI and motion design of FactFit's landing page (`src/app/page.tsx` and `src/app/globals.css`) using modern design principles (Apple/Stripe aesthetic, 60-30-10 color rule, and cognitive fluency).

Context:
FactFit is an AI resume tailor that guarantees 0% hallucination by mathematically checking all resume bullets against user-verified facts.

Requirements:
1. Redesign `src/app/page.tsx` hero section to engineer an immediate 50ms Halo Effect:
   - Palette: 60% Stone-50 (`#fafaf9`), 30% Stone-900 typography & hairline borders (`border-stone-200/80`), 10% Emerald-600 accents.
   - Generous whitespace, razor-sharp typography scale, and subtle ambient radial glow behind the hero container.
2. Build an Interactive Proof Showcase Component in the hero:
   - Split comparison showing:
     * "Typical AI Resume": marked with red alert tags on fabricated numbers ("Invented +45% metric - UNVERIFIED").
     * "FactFit Verified": highlighted with emerald citation pills linking directly back to fact bank sources ("Verified against Project Z fact").
3. Micro-Interactions & Motion:
   - Steps 01, 02, 03 cards: Staggered fade-in-up animation on scroll.
   - Primary CTA button: Subtle hover elevation (`hover:-translate-y-0.5`), soft emerald shadow, and tactile click compression (`active:scale-[0.98]`).
4. Constraints:
   - No scrolljacking (preserve native scroll mechanics).
   - Do not modify existing Supabase/Drizzle backend logic or schema.
   - Guarantee 100% mobile responsiveness and WCAG AA contrast compliance.
```

### Prompt 2: Score Badge Animation & Dashboard Cards Polish
```text
Task: Polish `src/components/score-badge.tsx` and the app dashboard in `src/app/app/page.tsx` with high-end micro-interactions following the Peak-End Rule.

Requirements:
1. `src/components/score-badge.tsx`:
   - Implement an animated SVG radial progress ring that smoothly draws stroke along the circle according to the match percentage.
   - Implement a smooth numeric count-up animation for the score value (e.g. 0% -> 87%) with `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Add a subtle emerald glow pulse for scores above 80%.
2. Dashboard Job Cards in `src/app/app/page.tsx`:
   - Add smooth card hover states (`hover:-translate-y-1 hover:shadow-md transition-all duration-200`).
   - Add live status pills with subtle blinking green beacon indicators for active applications.
   - Ensure clean keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-emerald-600`) for accessibility.
```
