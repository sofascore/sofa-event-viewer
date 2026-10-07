import type { Event, Score } from "./types";

/** 2320 → "38:40" */
export function formatSeconds(seconds: unknown): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return "";
  }
  const whole = Math.round(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDateTime(timestamp: number | undefined): string {
  if (undefined === timestamp) {
    return "";
  }
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(timestamp: number | undefined): string {
  if (undefined === timestamp) {
    return "";
  }
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Incident time as shown on the site: 90 + 3 → "90+3'". addedTime 999 marks period ends. */
export function formatIncidentTime(time: number | undefined, addedTime: number | undefined): string {
  if (undefined === time) {
    return "";
  }
  if (-1 === time) {
    return "?";
  }
  if (-5 === time) {
    return "bench";
  }
  if (undefined !== addedTime && addedTime > 0 && 999 !== addedTime) {
    return `${time}+${addedTime}'`;
  }
  return `${time}'`;
}

export function formatValue(value: unknown): string {
  if (null === value || undefined === value) {
    return "";
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return String(value);
    }
    return String(Math.round(value * 100) / 100);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

const SCORE_KEY_ORDER = [
  "period1",
  "period2",
  "period3",
  "period4",
  "period5",
  "period6",
  "period7",
  "period8",
  "period9",
  "overtime",
  "extra1",
  "extra2",
  "penalties",
  "normaltime",
  "current",
  "display",
];

function scoreKeyRank(key: string): number {
  const index = SCORE_KEY_ORDER.indexOf(key);
  if (-1 !== index) {
    return index;
  }
  const period = /^period(\d+)$/.exec(key);
  if (null !== period) {
    return Number(period[1]) - 1;
  }
  return SCORE_KEY_ORDER.length;
}

function hasValue(score: Score | undefined, key: string): boolean {
  const value = score?.[key];
  return undefined !== value && null !== value;
}

export interface PeriodColumn {
  key: string;
  label: string;
}

/**
 * Columns for the period scores table. Follows the real GenericRounds: keys and labels from
 * `event.periods`, skipping empty extra periods. Without `periods`, every score key present.
 */
export function periodColumns(event: Event): PeriodColumn[] {
  const { homeScore, awayScore, periods } = event;
  const either = (key: string) => hasValue(homeScore, key) || hasValue(awayScore, key);
  const columns: PeriodColumn[] = [];
  const seen = new Set<string>();

  if (periods) {
    const defaultCount = event.defaultPeriodCount ?? Infinity;
    for (const [key, label] of Object.entries(periods)) {
      if ("current" === key || "point" === key) {
        continue;
      }
      const period = /^period(\d+)$/.exec(key);
      if (null !== period && Number(period[1]) > defaultCount && !either(key)) {
        continue;
      }
      if (("overtime" === key || "penalties" === key) && !either(key)) {
        continue;
      }
      columns.push({ key, label });
      seen.add(key);
    }
  }

  // Keys the API sent that `periods` doesn't name still get a column, so no score is hidden.
  const remaining = new Set<string>([...Object.keys(homeScore ?? {}), ...Object.keys(awayScore ?? {})]);
  const extra = [...remaining]
    .filter((key) => !seen.has(key) && either(key))
    .sort((a, b) => scoreKeyRank(a) - scoreKeyRank(b) || a.localeCompare(b));
  for (const key of extra) {
    columns.push({ key, label: key });
  }
  return columns;
}

export function sportSlug(event: Event | undefined): string | undefined {
  return event?.tournament?.category?.sport?.slug;
}

/** sofascore.com URL (`…#id:123`), numeric id or customId → what to resolve. */
export function parseEventInput(input: string): { id: string } | { customId: string } | null {
  const value = input.trim();
  if ("" === value) {
    return null;
  }
  const hashId = /#id:(\d+)/.exec(value);
  if (null !== hashId) {
    return { id: hashId[1] };
  }
  if (/^\d+$/.test(value)) {
    return { id: value };
  }
  if (value.includes("/")) {
    // Match URL without the hash: the last path segment is the customId.
    const path = value.replace(/[?#].*$/, "").replace(/\/+$/, "");
    const last = path.split("/").pop();
    if (undefined === last || "" === last) {
      return null;
    }
    if (/^\d+$/.test(last)) {
      return { id: last };
    }
    return { customId: last };
  }
  if (/^[A-Za-z0-9]+$/.test(value)) {
    return { customId: value };
  }
  return null;
}
