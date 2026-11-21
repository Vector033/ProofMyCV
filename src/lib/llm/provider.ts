import { z } from "zod";

// Every model call goes through this interface so the provider can be swapped
// (Gemini today; Claude or a fake in tests) without touching the callers.
export interface LlmProvider {
  /** Provider and model; after a call, the model that actually answered. */
  readonly name: string;
  json<T>(req: { system: string; prompt: string; schema: z.ZodType<T>; images?: LlmImage[] }): Promise<T>;
}

/** An image sent with the prompt (e.g. a job poster), base64-encoded, never stored. */
export type LlmImage = { mimeType: "image/png" | "image/jpeg" | "image/webp"; data: string };

export class LlmError extends Error {}

const DEFAULT_MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];
// Overload and rate-limit responses are worth retrying; anything else is not.
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const RETRIES_PER_MODEL = 2;
const REQUEST_TIMEOUT_MS = 45_000;
const MAX_RETRY_WAIT_S = 20;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class GeminiProvider implements LlmProvider {
  private used?: string;

  constructor(
    private apiKey: string,
    private models: string[] = DEFAULT_MODELS,
  ) {}

  get name() {
    return `gemini:${this.used ?? this.models[0]}`;
  }

  async json<T>({ system, prompt, schema, images = [] }: { system: string; prompt: string; schema: z.ZodType<T>; images?: LlmImage[] }) {
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }, ...images.map((i) => ({ inlineData: i }))] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema, { target: "draft-7" }),
      },
    });

    // Try each model in order, retrying overloads with backoff before falling
    // back to the next one.
    let lastError = "no model configured";
    for (const model of this.models) {
      for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
        if (attempt > 0) await sleep(800 * 2 ** (attempt - 1));
        let res: Response;
        try {
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
            body,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });
        } catch (e) {
          // A model that hangs is usually overloaded; waiting again rarely helps.
          lastError = `Gemini ${model}: ${e instanceof Error ? e.name : "request failed"}`;
          break;
        }
        if (res.ok) {
          this.used = model;
          return parseOutput(await res.json(), schema);
        }
        const errorBody = await res.text();
        lastError = `Gemini ${model} ${res.status}: ${errorBody.slice(0, 200)}`;
        if (!RETRYABLE.has(res.status)) throw new LlmError(lastError);
        // A per-minute rate limit says how long to wait; honour short waits
        // instead of burning the retry. Daily quota waits are too long, so move on.
        const wait = Number(errorBody.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/)?.[1]);
        if (res.status === 429 && wait > 0 && wait <= MAX_RETRY_WAIT_S) await sleep(wait * 1000);
      }
    }
    throw new LlmError(lastError);
  }
}

function parseOutput<T>(body: unknown, schema: z.ZodType<T>): T {
  const { candidates } = body as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new LlmError("Model did not return JSON");
  }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new LlmError(`Model output failed validation: ${result.error.message}`);
  return result.data;
}

/**
 * Any OpenAI-compatible chat endpoint. Used for FreeLLMAPI, a local router over
 * free model tiers (http://127.0.0.1:31415/v1). It only runs on this machine, so it
 * is for dev and evals; the deployed app never selects it (see getLlm).
 */
export class OpenAICompatibleProvider implements LlmProvider {
  private used?: string;

  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string,
    private label = "openai",
  ) {}

  get name() {
    return `${this.label}:${this.used ?? this.model}`;
  }

  async json<T>({ system, prompt, schema, images = [] }: { system: string; prompt: string; schema: z.ZodType<T>; images?: LlmImage[] }) {
    // Not every upstream honours json_schema, so the schema also goes in the prompt
    // and the reply is validated with zod either way.
    const jsonSchema = z.toJSONSchema(schema, { target: "draft-7" });
    const messages = [
      {
        role: "system",
        content: `${system}\n\nReply with one JSON object only, no prose and no code fences, matching this JSON schema:\n${JSON.stringify(jsonSchema)}`,
      },
      {
        role: "user",
        content: images.length
          ? [{ type: "text", text: prompt }, ...images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.mimeType};base64,${i.data}` } }))]
          : prompt,
      },
    ];
    let lastError = "no attempt made";
    for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
      if (attempt > 0) await sleep(800 * 2 ** (attempt - 1));
      let res: Response;
      try {
        res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS * 2), // routed and reasoning models are slower
        });
      } catch (e) {
        lastError = `${this.label} ${this.model}: ${e instanceof Error ? e.name : "request failed"}`;
        continue;
      }
      if (!res.ok) {
        lastError = `${this.label} ${this.model} ${res.status}: ${(await res.text()).slice(0, 200)}`;
        if (!RETRYABLE.has(res.status)) throw new LlmError(lastError);
        continue;
      }
      const body = (await res.json()) as { model?: string; choices?: { message?: { content?: string | null } }[] };
      this.used = body.model ?? this.model;
      try {
        return parseJsonText(body.choices?.[0]?.message?.content ?? "", schema);
      } catch (e) {
        // A malformed reply from a free model is often a one-off; ask again.
        lastError = e instanceof Error ? e.message : String(e);
      }
    }
    throw new LlmError(lastError);
  }
}

function parseJsonText<T>(raw: string, schema: z.ZodType<T>): T {
  // Strip reasoning blocks and code fences some models add despite the instruction.
  const text = raw
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  let parsed: unknown;
  try {
    parsed = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
  } catch {
    throw new LlmError("Model did not return JSON");
  }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new LlmError(`Model output failed validation: ${result.error.message}`);
  return result.data;
}

const isLocalUrl = (url: string) => /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?\//.test(url);

/**
 * The configured provider, or null when none is set.
 * LLM_PROVIDER=freellmapi (dev/eval only) uses FREELLMAPI_KEY, FREELLMAPI_MODEL
 * (default "auto") and FREELLMAPI_BASE_URL; anything else uses GEMINI_API_KEY.
 */
export function getLlm(): LlmProvider | null {
  if (process.env.LLM_PROVIDER === "freellmapi") {
    const base = process.env.FREELLMAPI_BASE_URL ?? "http://127.0.0.1:31415/v1";
    const key = process.env.FREELLMAPI_KEY;
    // A local router cannot be reached from Vercel; fall through to Gemini there.
    if (key && isLocalUrl(base) && !process.env.VERCEL) {
      return new OpenAICompatibleProvider(base, key, process.env.FREELLMAPI_MODEL || "auto", "freellmapi");
    }
  }
  return getGemini();
}

function getGemini(): LlmProvider | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const models = (process.env.GEMINI_MODEL ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return new GeminiProvider(key, models.length ? models : undefined);
}
