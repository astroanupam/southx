import { describe, expect, it } from "vitest";
import { formatOffset, parseOffset, resolveCivilTime } from "./tz";

const L = (year: number, month: number, day: number, hour: number, minute = 0, second = 0) => ({ year, month, day, hour, minute, second });

describe("resolveCivilTime", () => {
  it("India modern, no DST: +05:30", () => {
    const r = resolveCivilTime(L(1990, 6, 15, 10, 30), "Asia/Kolkata");
    expect(r.offsetSec).toBe(19800);
    expect(r.dstActive).toBe(false);
    expect(r.utcIso).toBe("1990-06-15T05:00:00.000Z");
  });
  it("US summer is DST, winter is not", () => {
    expect(resolveCivilTime(L(2024, 7, 1, 12), "America/New_York").dstActive).toBe(true);
    expect(resolveCivilTime(L(2024, 1, 1, 12), "America/New_York").dstActive).toBe(false);
    expect(resolveCivilTime(L(2024, 7, 1, 12), "America/New_York").offsetSec).toBe(-4 * 3600);
  });
  it("India wartime time 1943 differs from modern offset (historical TZDB)", () => {
    const r = resolveCivilTime(L(1943, 6, 1, 12), "Asia/Kolkata");
    expect(r.offsetSec).not.toBe(19800);
  });
  it("repeated hour on DST end is flagged", () => {
    const r = resolveCivilTime(L(2024, 11, 3, 1, 30), "America/New_York");
    expect(r.warnings).toContain("AMBIGUOUS_LOCAL_TIME_REPEATED_HOUR");
  });
  it("skipped hour on DST start is flagged", () => {
    const r = resolveCivilTime(L(2024, 3, 10, 2, 30), "America/New_York");
    expect(r.warnings).toContain("SKIPPED_LOCAL_TIME_CHECK_MANUALLY");
  });
  it("manual offset is recorded as manual", () => {
    const r = resolveCivilTime(L(1900, 1, 1, 12), "Asia/Kolkata", { offsetSec: 19800, reason: "record" });
    expect(r.source).toBe("manual");
    expect(r.utcIso).toBe("1900-01-01T06:30:00.000Z");
  });
  it("leap day works", () => {
    const r = resolveCivilTime(L(2000, 2, 29, 0, 0), "Asia/Kolkata");
    expect(r.utcIso).toBe("2000-02-28T18:30:00.000Z");
  });
});

describe("offset helpers", () => {
  it("parses and formats", () => {
    expect(parseOffset("+05:30")).toBe(19800);
    expect(parseOffset("-0330")).toBe(-12600);
    expect(parseOffset("abc")).toBeNull();
    expect(formatOffset(19800)).toBe("+05:30");
  });
});
