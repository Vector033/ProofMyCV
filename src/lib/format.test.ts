import { describe, expect, it } from "vitest";
import { PDF_UNSAFE, formatRange } from "./format";

describe("formatRange", () => {
  it("prints one month when start and end are the same", () => {
    expect(formatRange({ startDate: "2026-11", endDate: "2026-11" })).toBe("Nov 2026");
  });
  it("keeps year-only dates as years", () => {
    expect(formatRange({ startDate: "2024", endDate: null })).toBe("2024 – Present");
    expect(formatRange({ startDate: "2023", endDate: "2027" })).toBe("2023 – 2027");
  });
  it("prints month ranges and open ranges", () => {
    expect(formatRange({ startDate: "2027-06", endDate: "2027-10" })).toBe("Jun 2027 – Oct 2027");
    expect(formatRange({ startDate: null, endDate: null })).toBe("");
  });
});

describe("PDF_UNSAFE", () => {
  it("finds Thai marks but allows Latin text and resume punctuation", () => {
    expect("\u0E4CNawat Wattanawong".match(PDF_UNSAFE)).toEqual(["\u0E4C"]);
    expect("you@example.com \u00B7 Bangkok \u2013 2027 \u201Cquoted\u201D \u2022".match(PDF_UNSAFE)).toBeNull();
  });
});
