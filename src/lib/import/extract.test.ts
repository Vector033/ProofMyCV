import { createElement as h } from "react";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { MAX_RESUME_BYTES, ResumeFileError, docxText, resumeText, sniffResume } from "./extract";
import { parseResumeRuleBased } from "../core/resume";

// Fictional resume (no real person) used for both fixtures.
const LINES = [
  "Mali Example",
  "EXPERIENCE",
  "Backend Intern | Fictional Labs",
  "Jun 2025 – Aug 2025",
  "• Cut API response time from 900 ms to 300 ms by adding a Redis cache",
  "• Wrote 40 pytest tests for the billing service",
  "PROJECTS",
  "Plant Diary — class project",
  "• Built a React Native app with 3 classmates",
];

function docx(paragraphs: string[]) {
  const p = (t: string) => {
    const bullet = t.startsWith("• ");
    const text = bullet ? t.slice(2) : t;
    return `<w:p>${bullet ? '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>' : ""}<w:r><w:t xml:space="preserve">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</w:t></w:r></w:p>`;
  };
  const xml = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.map(p).join("")}</w:body></w:document>`;
  return zipSync({ "[Content_Types].xml": strToU8("<Types/>"), "word/document.xml": strToU8(xml) });
}

async function pdf(lines: string[]) {
  const doc = h(Document, null, h(Page, { size: "A4", style: { padding: 40, fontSize: 11 } }, ...lines.map((l, i) => h(Text, { key: i }, l))));
  return new Uint8Array(await renderToBuffer(doc));
}

describe("sniffResume", () => {
  it("reads the type from magic bytes, not the name", () => {
    expect(sniffResume(strToU8("%PDF-1.7 ..."))).toBe("pdf");
    expect(sniffResume(docx(["x"]))).toBe("docx");
    expect(sniffResume(strToU8("<html>not a resume"))).toBeNull();
  });
});

describe("docxText", () => {
  it("keeps one line per paragraph and marks list items as bullets", () => {
    expect(docxText(docx(LINES)).split("\n")).toEqual(LINES);
  });

  it("decodes XML entities", () => {
    expect(docxText(docx(["R&D at A <B>"]))).toBe("R&D at A <B>");
  });

  it("never inflates an oversized document.xml, even when the zip lies about its size", () => {
    const bomb = zipSync({ "word/document.xml": new Uint8Array(9 * 1024 * 1024) });
    expect(() => docxText(bomb)).toThrow(ResumeFileError);
    // Rewrite the declared size (local header offset 22, central directory +24) to 1 KB.
    const liar = bomb.slice();
    const view = new DataView(liar.buffer);
    const cd = liar.findLastIndex((_, i) => i + 4 <= liar.length && view.getUint32(i, true) === 0x02014b50);
    view.setUint32(22, 1024, true);
    view.setUint32(cd + 24, 1024, true);
    // fflate inflates into a buffer of the declared size and stops there.
    expect(docxText(liar)).toBe("");
  });

  it("rejects a zip without word/document.xml", () => {
    expect(() => docxText(zipSync({ "a.txt": strToU8("hi") }))).toThrow(ResumeFileError);
  });
});

describe("resumeText", () => {
  it("rejects files over the size cap and unknown types", async () => {
    await expect(resumeText(new Uint8Array(MAX_RESUME_BYTES + 1))).rejects.toThrow("2 MB");
    await expect(resumeText(strToU8("plain text"))).rejects.toThrow(".docx or .pdf");
  });

  it("gives the same draft for the .docx and the .pdf of one resume", async () => {
    const fromDocx = parseResumeRuleBased(await resumeText(docx(LINES)));
    const fromPdf = parseResumeRuleBased(await resumeText(await pdf(LINES)));
    expect(fromPdf).toEqual(fromDocx);
    expect(fromDocx).toEqual([
      {
        kind: "job",
        title: "Backend Intern",
        org: "Fictional Labs",
        startDate: "2025-06",
        endDate: "2025-08",
        facts: [
          { did: "Cut API response time from 900 ms to 300 ms by adding a Redis cache", result: null, tech: ["Redis"] },
          { did: "Wrote 40 pytest tests for the billing service", result: null, tech: ["Pytest"] },
        ],
      },
      {
        kind: "project",
        title: "Plant Diary",
        org: "class project",
        startDate: null,
        endDate: null,
        facts: [{ did: "Built a React Native app with 3 classmates", result: null, tech: ["React Native"] }],
      },
    ]);
  });
});
