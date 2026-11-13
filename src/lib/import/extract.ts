import { unzipSync } from "fflate";

// Reads the text out of an uploaded resume, in memory only. The file is never
// written anywhere; callers drop the bytes once they have the text.

export const MAX_RESUME_BYTES = 2 * 1024 * 1024;
const MAX_XML_BYTES = 8 * 1024 * 1024; // an unzipped document.xml above this is a zip bomb, not a resume
const MAX_PDF_PAGES = 10;
export const MAX_RESUME_CHARS = 30_000;

export class ResumeFileError extends Error {}

/** File type from the first bytes, never from the name or the browser's MIME type. */
export function sniffResume(bytes: Uint8Array): "pdf" | "docx" | null {
  const head = String.fromCharCode(...bytes.subarray(0, 5));
  if (head === "%PDF-") return "pdf";
  // A .docx is a zip (PK\x03\x04) holding word/document.xml; checked again on unzip.
  if (head.startsWith("PK\x03\x04")) return "docx";
  return null;
}

const decodeXml = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** One line per Word paragraph; list paragraphs get a "• " so the fallback parser sees bullets. */
export function docxText(bytes: Uint8Array): string {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: (f) => f.name === "word/document.xml" && f.originalSize <= MAX_XML_BYTES,
    });
  } catch {
    throw new ResumeFileError("This .docx file could not be opened.");
  }
  const xml = files["word/document.xml"];
  if (!xml) throw new ResumeFileError("This file is a zip, but not a Word document.");
  const body = new TextDecoder().decode(xml);
  const paragraphs = body.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
  return paragraphs
    .map((p) => {
      const text = p
        .replace(/<w:tab\/>/g, " ")
        .replace(/<w:br[^>]*\/>/g, "\n")
        .match(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>|\n/g)
        ?.map((t) => (t === "\n" ? "\n" : decodeXml(t.replace(/<[^>]+>/g, ""))))
        .join("")
        .trim();
      if (!text) return "";
      return p.includes("<w:numPr>") ? `• ${text}` : text;
    })
    .filter(Boolean)
    .join("\n");
}

export async function pdfText(bytes: Uint8Array): Promise<string> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  let doc;
  try {
    doc = await getDocumentProxy(bytes);
  } catch {
    throw new ResumeFileError("This PDF could not be opened. If it has a password, remove it and try again.");
  }
  try {
    if (doc.numPages > MAX_PDF_PAGES) throw new ResumeFileError(`This PDF has ${doc.numPages} pages. Upload a resume of ${MAX_PDF_PAGES} pages or fewer.`);
    const { text } = await extractText(doc, { mergePages: true });
    return text;
  } finally {
    await doc.loadingTask.destroy();
  }
}

/** Plain text of a .docx or .pdf resume, capped at MAX_RESUME_CHARS. */
export async function resumeText(bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength > MAX_RESUME_BYTES) throw new ResumeFileError("The file is larger than 2 MB.");
  const type = sniffResume(bytes);
  if (!type) throw new ResumeFileError("Upload a .docx or .pdf file.");
  const text = (type === "pdf" ? await pdfText(bytes) : docxText(bytes)).trim();
  if (!text) {
    throw new ResumeFileError(
      type === "pdf"
        ? "No text found in this PDF. It may be a scanned image; upload the .docx or a PDF exported from Word or Docs."
        : "No text found in this document.",
    );
  }
  return text.slice(0, MAX_RESUME_CHARS);
}
