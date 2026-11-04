import { z } from "zod";

// Every model call goes through this interface so the provider can be swapped
// (Gemini today; Claude or a fake in tests) without touching the callers.
export interface LlmProvider {
  /** Provider and model; after a call, the model that actually answered. */
  readonly name: string;
  json<T>(req: { system: string; prompt: string; schema: z.ZodType<T> }): Promise<T>;
}

export class LlmError extends Error {}

const DEFAULT_MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"];
// Overload and rate-limit responses are worth retrying; anything else is not.
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const RETRIES_PER_MODEL = 2;
const REQUEST_TIMEOUT_MS = 45_000;

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

  async json<T>({ system, prompt, schema }: { system: string; prompt: string; schema: z.ZodType<T> }) {
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
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
        lastError = `Gemini ${model} ${res.status}: ${(await res.text()).slice(0, 200)}`;
        if (!RETRYABLE.has(res.status)) throw new LlmError(lastError);
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

/** The configured provider, or null when no API key is set. */
export function getLlm(): LlmProvider | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const models = (process.env.GEMINI_MODEL ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return new GeminiProvider(key, models.length ? models : undefined);
}
