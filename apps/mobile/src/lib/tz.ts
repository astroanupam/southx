// Historical time-zone resolution using the browser's IANA tz database (ICU).
// This is civil-time handling only (Stage 1). No astronomical calculation here.

export interface LocalDateTime {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface ResolvedTime {
  tzId: string;
  offsetSec: number; // UTC offset in effect at the birth instant (seconds, east positive)
  dstActive: boolean;
  source: "auto" | "manual";
  manualReason?: string;
  utcIso: string; // ISO instant
  localCivil: string; // YYYY-MM-DD HH:MM:SS
  warnings: string[];
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function dtf(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    dtfCache.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    dtf(tz);
    return true;
  } catch {
    return false;
  }
}

/** UTC offset (seconds) that `tz` had at the given UTC instant (ms). */
export function offsetAtUtc(tz: string, utcMs: number): number {
  const p: Record<string, number> = {};
  for (const part of dtf(tz).formatToParts(new Date(utcMs))) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 1000);
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0");
}

export function formatLocal(l: LocalDateTime) {
  return `${pad(l.year, 4)}-${pad(l.month)}-${pad(l.day)} ${pad(l.hour)}:${pad(l.minute)}:${pad(l.second)}`;
}

export function formatOffset(sec: number) {
  const sign = sec < 0 ? "-" : "+";
  const a = Math.abs(sec);
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const s = a % 60;
  return `${sign}${pad(h)}:${pad(m)}${s ? ":" + pad(s) : ""}`;
}

/** Parse "+05:30" / "-0330" / "+05:53:28" into seconds, or null. */
export function parseOffset(text: string): number | null {
  const m = /^([+-])(\d{1,2}):?(\d{2})(?::?(\d{2}))?$/.exec(text.trim());
  if (!m) return null;
  const sec = Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4] ?? 0);
  if (Number(m[2]) > 18 || Number(m[3]) > 59) return null;
  return m[1] === "-" ? -sec : sec;
}

export function resolveCivilTime(
  local: LocalDateTime,
  tz: string,
  manual?: { offsetSec: number; reason: string },
): ResolvedTime {
  const warnings: string[] = [];
  const localMs = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);

  if (manual) {
    const utcMs = localMs - manual.offsetSec * 1000;
    return {
      tzId: tz,
      offsetSec: manual.offsetSec,
      dstActive: false,
      source: "manual",
      manualReason: manual.reason,
      utcIso: new Date(utcMs).toISOString(),
      localCivil: formatLocal(local),
      warnings: ["Manual offset used; DST status not determined."],
    };
  }

  // Find the UTC instant whose local rendering equals the entered civil time.
  // Candidate offsets come from a day either side, so DST gaps/overlaps are detected.
  const DAY = 86400000;
  const cands = Array.from(new Set([offsetAtUtc(tz, localMs - DAY), offsetAtUtc(tz, localMs + DAY)]));
  const valid = cands
    .map((o) => localMs - o * 1000)
    .filter((u) => offsetAtUtc(tz, u) === (localMs - u) / 1000)
    .sort((x, y) => x - y);
  let utcMs: number;
  if (valid.length === 1) {
    utcMs = valid[0];
  } else if (valid.length > 1) {
    utcMs = valid[0]; // repeated hour: first occurrence (earlier instant)
    warnings.push("AMBIGUOUS_LOCAL_TIME_REPEATED_HOUR");
  } else {
    // Skipped local time (clock moved forward): use the offset in force before the change.
    utcMs = localMs - offsetAtUtc(tz, localMs - DAY) * 1000;
    warnings.push("SKIPPED_LOCAL_TIME_CHECK_MANUALLY");
  }
  const offsetSec = offsetAtUtc(tz, utcMs);
  // DST heuristic: offset greater than the smaller of the January and July offsets that year.
  const y = local.year;
  const jan = offsetAtUtc(tz, Date.UTC(y, 0, 1));
  const jul = offsetAtUtc(tz, Date.UTC(y, 6, 1));
  const standard = Math.min(jan, jul);
  const dstActive = jan !== jul && offsetSec > standard;
  if (y < 1900) warnings.push("PRE_1900_LMT_POSSIBLE");

  return {
    tzId: tz,
    offsetSec,
    dstActive,
    source: "auto",
    utcIso: new Date(utcMs).toISOString(),
    localCivil: formatLocal(local),
    warnings,
  };
}
