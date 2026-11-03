import { z } from "zod";

// Every model call goes through this interface so the provider can be swapped
// (Gemini today; Claude or a fake in tests) without touching the callers.
export interface LlmProvider {
  readonly name: string;
  json<T>(req: { system: string; prompt: string; schema: z.ZodType<T> }): Promise<T>;
}

export class LlmError extends Error {}

export class GeminiProvider implements LlmProvider {
  readonly name: string;

  constructor(
    private apiKey: string,
    private model = "gemini-flash-latest",
  ) {
    this.name = `gemini:${model}`;
  }

  async json<T>({ system, prompt, schema }: { system: string; prompt: string; schema: z.ZodType<T> }) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(schema, { target: "draft-7" }),
          },
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (!res.ok) throw new LlmError(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
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
}

/** The configured provider, or null when no API key is set. */
export function getLlm(): LlmProvider | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GeminiProvider(key, process.env.GEMINI_MODEL || undefined);
}
