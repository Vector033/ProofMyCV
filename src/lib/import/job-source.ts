import { lookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";

// Reads a job posting from a link the user pasted. The server fetches it, so the
// link must never reach the server's own network: every address a hostname
// resolves to is checked when the connection is made (not just once up front,
// which DNS rebinding could get around), and again on every redirect.

export class JobLinkError extends Error {}

export const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
export const MAX_JOB_CHARS = 20_000;
export const MAX_POSTER_BYTES = 2.5 * 1024 * 1024; // under the 3 MB server-action body limit

/** Image type from the first bytes, never from the name or the browser's MIME type. */
export function sniffImage(b: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Private, loopback, link-local (incl. cloud metadata), CGNAT, multicast and reserved addresses. */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v = ip.toLowerCase().replace(/^\[|\]$/g, "");
  const mapped = v.match(/^::ffff:(?:(\d+\.\d+\.\d+\.\d+)|([0-9a-f]{1,4}):([0-9a-f]{1,4}))$/);
  if (mapped) {
    const v4 = mapped[1] ?? [mapped[2], mapped[3]].flatMap((h) => { const n = parseInt(h, 16); return [n >> 8, n & 255]; }).join(".");
    return isPrivateAddress(v4);
  }
  return v === "::" || v === "::1" || /^(fc|fd|fe[89ab]|ff)/.test(v) || v.startsWith("64:ff9b:");
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** dns.lookup that refuses private addresses, used by the socket itself at connect time. */
function safeLookup(hostname: string, options: { all?: boolean }, callback: LookupCallback) {
  lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err, []);
    if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
      return callback(Object.assign(new JobLinkError("That link points to a private network address."), { code: "EPRIVATE" }), []);
    }
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  });
}

/** Checks a URL before any request: http(s) only, standard ports, no private IP literals, no credentials. */
export function checkJobUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new JobLinkError("That doesn't look like a link. Paste the full address, starting with https://");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new JobLinkError("Only http and https links can be read.");
  if (url.username || url.password) throw new JobLinkError("Links with a username or password can't be read.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new JobLinkError("Links on unusual ports can't be read.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && isPrivateAddress(host)) throw new JobLinkError("That link points to a private network address.");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new JobLinkError("That link points to a private network address.");
  }
  return url;
}

function get(url: URL): Promise<{ status: number; location?: string; type: string; body: string }> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.get(
      url,
      {
        lookup: safeLookup as unknown as typeof lookup,
        timeout: TIMEOUT_MS,
        headers: { "user-agent": "FactFit job-link reader", accept: "text/html,text/plain;q=0.9" },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const type = String(res.headers["content-type"] ?? "");
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, location: res.headers.location, type, body: "" });
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > MAX_PAGE_BYTES) {
            req.destroy(); // keep what fits: the posting is near the top of almost every page
            return resolve({ status, type, body: Buffer.concat(chunks).toString("utf8") });
          }
          chunks.push(c);
        });
        res.on("end", () => resolve({ status, type, body: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new JobLinkError("The page took too long to answer.")));
    req.on("error", reject);
  });
}

/** Visible text of an HTML page: no scripts, styles, navigation or footers; one block per line. */
export function htmlToText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe|template)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article)\b[^>]*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((l) => l.replace(/[ \t\f\v]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** The text of the job posting at a link, for the user to review before it is analysed. */
export async function fetchJobText(raw: string): Promise<string> {
  let url = checkJobUrl(raw);
  for (let hop = 0; ; hop++) {
    let res;
    try {
      res = await get(url);
    } catch (e) {
      if (e instanceof JobLinkError) throw e;
      if ((e as { code?: string }).code === "EPRIVATE") throw new JobLinkError("That link points to a private network address.");
      throw new JobLinkError("The page could not be reached. Check the link, or paste the text instead.");
    }
    if (res.location) {
      if (hop >= MAX_REDIRECTS) throw new JobLinkError("The link redirects too many times.");
      url = checkJobUrl(new URL(res.location, url).toString());
      continue;
    }
    if (res.status === 401 || res.status === 403) {
      throw new JobLinkError("That site needs a login or blocks readers (LinkedIn and Facebook do). Paste the text or a screenshot instead.");
    }
    if (res.status !== 200) throw new JobLinkError(`The page answered with an error (${res.status}).`);
    if (!/text\/(html|plain)/i.test(res.type)) throw new JobLinkError("That link is not a web page. Paste the text instead.");
    const text = (/text\/plain/i.test(res.type) ? res.body : htmlToText(res.body)).slice(0, MAX_JOB_CHARS);
    if (text.length < 200) {
      throw new JobLinkError("Almost no text came back; the site may need a login or load the posting with scripts. Paste the text or a screenshot instead.");
    }
    return text;
  }
}
