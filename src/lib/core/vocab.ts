// Canonical technology vocabulary. Used to normalise skill names coming from a
// job description or an LLM, to find evidence in the fact bank, and by the
// fabrication guard to spot technology names that no fact supports.

export type TechTerm = {
  name: string;
  /** Lower-case spellings matched case-insensitively. */
  aliases?: string[];
  /** Spellings matched with exact case only (for words that are also plain English). */
  exact?: string[];
};

export const TECH_TERMS: TechTerm[] = [
  { name: "JavaScript", aliases: ["javascript", "js", "ecmascript", "es6"] },
  { name: "TypeScript", aliases: ["typescript", "ts"] },
  { name: "Python", aliases: ["python", "python3"] },
  { name: "Java", aliases: ["java"] },
  { name: "Kotlin", aliases: ["kotlin"] },
  { name: "Swift", exact: ["Swift", "SwiftUI"] },
  { name: "Go", aliases: ["golang"], exact: ["Go"] },
  { name: "Rust", exact: ["Rust"] },
  { name: "C#", aliases: ["c#", "csharp"] },
  { name: "C++", aliases: ["c++", "cpp"] },
  { name: "PHP", aliases: ["php"] },
  { name: "Ruby", exact: ["Ruby"] },
  { name: "Dart", exact: ["Dart"] },
  { name: "Lua", aliases: ["lua", "luau"] },
  { name: "SQL", aliases: ["sql"] },
  { name: "HTML", aliases: ["html", "html5"] },
  { name: "CSS", aliases: ["css", "css3"] },
  { name: "React", aliases: ["react", "react.js", "reactjs"] },
  { name: "React Native", aliases: ["react native"] },
  { name: "Next.js", aliases: ["next.js", "nextjs"] },
  { name: "Vue", aliases: ["vue", "vue.js", "vuejs", "vue 3"] },
  { name: "Nuxt", aliases: ["nuxt", "nuxt.js"] },
  { name: "Angular", aliases: ["angular", "angularjs"] },
  { name: "Svelte", aliases: ["svelte", "sveltekit"] },
  { name: "Tailwind CSS", aliases: ["tailwind", "tailwind css", "tailwindcss"] },
  { name: "Redux", aliases: ["redux"] },
  { name: "Node.js", aliases: ["node.js", "nodejs"], exact: ["Node"] },
  { name: "Express", aliases: ["express.js", "expressjs"], exact: ["Express"] },
  { name: "NestJS", aliases: ["nestjs", "nest.js"] },
  { name: "Deno", aliases: ["deno"] },
  { name: "FastAPI", aliases: ["fastapi"] },
  { name: "Django", aliases: ["django"] },
  { name: "Flask", aliases: ["flask"] },
  { name: "Spring Boot", aliases: ["spring boot"], exact: ["Spring"] },
  { name: ".NET", aliases: [".net", "dotnet", "asp.net"] },
  { name: "Laravel", aliases: ["laravel"] },
  { name: "Ruby on Rails", aliases: ["ruby on rails"], exact: ["Rails"] },
  { name: "Flutter", aliases: ["flutter"] },
  { name: "PostgreSQL", aliases: ["postgresql", "postgres", "psql"] },
  { name: "MySQL", aliases: ["mysql"] },
  { name: "SQLite", aliases: ["sqlite"] },
  { name: "MongoDB", aliases: ["mongodb", "mongo"] },
  { name: "Redis", aliases: ["redis"] },
  { name: "Elasticsearch", aliases: ["elasticsearch", "elastic search"] },
  { name: "Firebase", aliases: ["firebase"] },
  { name: "Firestore", aliases: ["firestore"] },
  { name: "Supabase", aliases: ["supabase"] },
  { name: "Prisma", aliases: ["prisma"] },
  { name: "Drizzle", aliases: ["drizzle", "drizzle orm"] },
  { name: "GraphQL", aliases: ["graphql"] },
  { name: "REST", aliases: ["rest api", "rest apis", "restful"], exact: ["REST"] },
  { name: "gRPC", aliases: ["grpc"] },
  { name: "WebSocket", aliases: ["websocket", "websockets"] },
  { name: "Kafka", aliases: ["kafka"] },
  { name: "RabbitMQ", aliases: ["rabbitmq"] },
  { name: "Docker", aliases: ["docker", "dockerfile"] },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { name: "Terraform", aliases: ["terraform"] },
  { name: "AWS", aliases: ["aws", "amazon web services"] },
  { name: "GCP", aliases: ["gcp", "google cloud", "google cloud platform"] },
  { name: "Azure", aliases: ["azure"] },
  { name: "Vercel", aliases: ["vercel"] },
  { name: "Linux", aliases: ["linux"] },
  { name: "Git", aliases: ["git"] },
  { name: "GitHub", aliases: ["github"] },
  { name: "GitHub Actions", aliases: ["github actions"] },
  { name: "CI/CD", aliases: ["ci/cd", "ci cd", "continuous integration"] },
  { name: "Jest", aliases: ["jest"] },
  { name: "Vitest", aliases: ["vitest"] },
  { name: "Playwright", aliases: ["playwright"] },
  { name: "Cypress", aliases: ["cypress"] },
  { name: "Pytest", aliases: ["pytest"] },
  { name: "Selenium", aliases: ["selenium"] },
  { name: "Microservices", aliases: ["microservices", "microservice"] },
  { name: "Machine Learning", aliases: ["machine learning", "ml"] },
  { name: "LLM", aliases: ["llm", "llms", "large language model", "large language models"] },
  { name: "Gemini", aliases: ["gemini"] },
  { name: "OpenAI", aliases: ["openai", "gpt-4", "chatgpt"] },
  { name: "TensorFlow", aliases: ["tensorflow"] },
  { name: "PyTorch", aliases: ["pytorch"] },
  { name: "Pandas", aliases: ["pandas"] },
  { name: "NumPy", aliases: ["numpy"] },
  { name: "Power BI", aliases: ["power bi", "powerbi"] },
  { name: "Tableau", aliases: ["tableau"] },
  { name: "Excel", exact: ["Excel"] },
  { name: "Figma", aliases: ["figma"] },
  { name: "Jira", aliases: ["jira"] },
  { name: "Agile", aliases: ["agile"] },
  { name: "Scrum", aliases: ["scrum"] },
  { name: "Unity", exact: ["Unity"] },
  { name: "Unreal Engine", aliases: ["unreal engine", "unreal"] },
  { name: "Roblox", aliases: ["roblox", "roblox studio"] },
  { name: "Blender", aliases: ["blender"] },
];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A term must not be glued to other word characters. "+", "#" and "." count as
// word characters on the left so "c++" does not match inside "objective-c++x",
// but a trailing "." is allowed so "Node.js." at the end of a sentence matches.
const boundaryWrap = (body: string) => `(?<![\\w+#.])${body}(?![\\w+#]|\\.\\w)`;

type CompiledTerm = { term: TechTerm; ci?: RegExp; cs?: RegExp };

const compile = (term: TechTerm): CompiledTerm => {
  const ci = term.aliases?.length
    ? new RegExp(boundaryWrap(`(?:${term.aliases.map(escapeRegex).join("|")})`), "i")
    : undefined;
  const cs = term.exact?.length
    ? new RegExp(boundaryWrap(`(?:${term.exact.map(escapeRegex).join("|")})`))
    : undefined;
  return { term, ci, cs };
};

const COMPILED = TECH_TERMS.map(compile);
const BY_KEY = new Map<string, CompiledTerm>();
for (const c of COMPILED) {
  BY_KEY.set(c.term.name.toLowerCase(), c);
  for (const a of c.term.aliases ?? []) BY_KEY.set(a, c);
  for (const e of c.term.exact ?? []) BY_KEY.set(e.toLowerCase(), c);
}

/** Map a free-form skill name to its canonical vocabulary entry, if any. */
export function canonicalTech(name: string): string | undefined {
  return BY_KEY.get(name.trim().toLowerCase())?.term.name;
}

const matchesCompiled = (c: CompiledTerm, text: string) =>
  Boolean(c.ci?.test(text) || c.cs?.test(text));

/** Canonical names of every vocabulary term mentioned in the text. */
export function findTechTerms(text: string): string[] {
  const found = COMPILED.filter((c) => matchesCompiled(c, text)).map((c) => c.term.name);
  // "React Native" also matches "React"; keep both only if React appears on its own.
  if (found.includes("React Native") && found.includes("React")) {
    const stripped = text.replace(/react native/gi, "");
    if (!matchesCompiled(BY_KEY.get("react")!, stripped)) {
      return found.filter((n) => n !== "React");
    }
  }
  if (found.includes("GitHub Actions") && found.includes("GitHub")) {
    const stripped = text.replace(/github actions/gi, "");
    if (!matchesCompiled(BY_KEY.get("github")!, stripped)) {
      return found.filter((n) => n !== "GitHub");
    }
  }
  return found;
}

const STOPWORDS = new Set(
  "a an and or the of for to in on with by at from as is are be using use used via into across our your their this that".split(
    " ",
  ),
);

const stem = (w: string) => w.replace(/(?:ing|ed|es|s)$/, "");

const contentWords = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((w) => w.replace(/\.$/, ""))
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);

/**
 * Does the text give evidence for a requirement? Vocabulary terms use their
 * aliases; anything else ("unit testing", "API design") needs every content
 * word of the phrase to appear in the text.
 */
export function mentions(text: string, requirement: string): boolean {
  const canonical = canonicalTech(requirement);
  if (canonical) return matchesCompiled(BY_KEY.get(canonical.toLowerCase())!, text);
  const needed = contentWords(requirement);
  if (needed.length === 0) return false;
  const have = new Set(contentWords(text));
  return needed.every((w) => have.has(w));
}
