// The demo account's fact bank. The person is fictional; never put real resume
// data here. Used by scripts/seed-demo.mts and by the in-app "Reset demo" action.

import type { ExperienceKind } from "./core/types";

export const DEMO_PROFILE = {
  fullName: "Alex Demo",
  headline: "Computer Science student",
  contact: "alex.demo@example.com · Chiang Mai",
  links: "github.com/alexdemo",
};

export type DemoExperience = {
  kind: ExperienceKind;
  title: string;
  org: string;
  location?: string;
  start: string;
  end: string | null;
  facts: { did: string; result?: string; tech: string[] }[];
};

export const DEMO_BANK: DemoExperience[] = [
  {
    kind: "job",
    title: "Software Engineering Intern",
    org: "Lanna Logistics",
    location: "Chiang Mai",
    start: "2026-06",
    end: "2026-08",
    facts: [
      { did: "Rebuilt the parcel tracking page in React and TypeScript", result: "Page load went from 4.1 s to 1.3 s", tech: ["React", "TypeScript"] },
      { did: "Added a PostgreSQL index and rewrote 2 slow reporting queries", result: "Daily report job dropped from 25 minutes to 3 minutes", tech: ["PostgreSQL", "SQL"] },
      { did: "Wrote Jest tests for the shipping-rate calculator", result: "Caught 6 pricing bugs before release", tech: ["Jest", "TypeScript"] },
    ],
  },
  {
    kind: "project",
    title: "StudyBuddy, course Q&A bot",
    org: "Personal project",
    start: "2025-11",
    end: "2026-02",
    facts: [
      { did: "Built a FastAPI backend that answers questions from course slides with Gemini", result: "Used by 120 classmates during finals", tech: ["Python", "FastAPI", "Gemini"] },
      { did: "Containerised the API with Docker and deployed it with GitHub Actions", tech: ["Docker", "GitHub Actions"] },
    ],
  },
  {
    kind: "education",
    title: "B.Sc. Computer Science",
    org: "Example University",
    start: "2024-06",
    end: "2028-05",
    facts: [{ did: "GPA 3.52, Data Structures and Databases teaching assistant", tech: [] }],
  },
];

/** A sample posting so a visitor can see the mapping without finding one. */
export const DEMO_JOB = {
  company: "Example Travel Co",
  role: "Junior Full-Stack Developer",
  jdText: `Junior Full-Stack Developer, Example Travel Co

What you'll do:
- Build and maintain REST APIs for our booking platform
- Speed up slow pages and reports for customers
- Ship features end to end with the product team

Requirements:
- TypeScript and React
- Python or Node.js on the backend
- PostgreSQL and efficient SQL
- Automated testing (Jest or similar)

Nice to have:
- Docker, Kubernetes
- AWS`,
};
