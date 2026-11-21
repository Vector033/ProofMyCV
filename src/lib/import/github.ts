// Reads a public GitHub repository (name, description, README, dependency lists) so
// it can be proposed as a project with facts. Only api.github.com and
// raw.githubusercontent.com are called, with owner/repo from a strict pattern.

export class RepoError extends Error {}

const TIMEOUT_MS = 10_000;
const MAX_README_CHARS = 30_000;

/** "github.com/owner/repo", a full URL (with .git or a sub-path) or "owner/repo". */
export function parseRepo(input: string): { owner: string; repo: string } | null {
  const m = input
    .trim()
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/^github\.com\//i, "")
    .match(/^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?(?:[/?#].*)?$/);
  return m && m[2] !== "." && m[2] !== ".." ? { owner: m[1], repo: m[2] } : null;
}

async function get(url: string, accept: string): Promise<Response> {
  const headers: Record<string, string> = { accept, "user-agent": "ProofMyCV repo importer" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "follow" });
}

/** Dependency names from package.json and requirements.txt, when present. */
export function dependencyNames(packageJson: string | null, requirements: string | null): string[] {
  const names: string[] = [];
  if (packageJson) {
    try {
      const p = JSON.parse(packageJson) as { dependencies?: object; devDependencies?: object };
      names.push(...Object.keys(p.dependencies ?? {}), ...Object.keys(p.devDependencies ?? {}));
    } catch {
      // A broken package.json just gives no names.
    }
  }
  if (requirements) {
    for (const line of requirements.split("\n")) {
      const name = line.trim().match(/^([A-Za-z0-9_.-]+)/)?.[1];
      if (name && !line.trim().startsWith("#")) names.push(name);
    }
  }
  return [...new Set(names)].slice(0, 200);
}

export type RepoInfo = { name: string; description: string; readme: string; dependencies: string[] };

export async function fetchRepo({ owner, repo }: { owner: string; repo: string }): Promise<RepoInfo> {
  const api = `https://api.github.com/repos/${owner}/${repo}`;
  let meta: Response;
  try {
    meta = await get(api, "application/vnd.github+json");
  } catch {
    throw new RepoError("GitHub could not be reached. Try again in a minute.");
  }
  if (meta.status === 404) throw new RepoError("That repository was not found, or it is private.");
  if (meta.status === 403 || meta.status === 429) throw new RepoError("GitHub's rate limit is reached for now. Try again later.");
  if (!meta.ok) throw new RepoError(`GitHub answered with an error (${meta.status}).`);
  const info = (await meta.json()) as { name?: string; description?: string | null; default_branch?: string };
  const branch = encodeURIComponent(info.default_branch ?? "HEAD");
  const raw = async (path: string) => {
    try {
      const r = await get(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`, "text/plain");
      return r.ok ? (await r.text()).slice(0, MAX_README_CHARS) : null;
    } catch {
      return null;
    }
  };
  const [readme, packageJson, requirements] = await Promise.all([
    get(`${api}/readme`, "application/vnd.github.raw")
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => ""),
    raw("package.json"),
    raw("requirements.txt"),
  ]);
  return {
    name: info.name ?? repo,
    description: info.description ?? "",
    readme: readme.slice(0, MAX_README_CHARS),
    dependencies: dependencyNames(packageJson, requirements),
  };
}
