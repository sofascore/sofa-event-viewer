"use client";

import { useMemo } from "react";
import { parseList, pushRecent, readList, useStoredRaw, writeRaw } from "./storage";

export const RECENT_EVENTS_KEY = "sofa-event-viewer:recentEvents";

export interface RecentEvent {
  id: number;
  label: string;
  sport?: string;
}

function parseEntry(raw: string): RecentEvent | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || null === value) {
      return null;
    }
    const entry = value as Partial<RecentEvent>;
    if (typeof entry.id !== "number" || typeof entry.label !== "string") {
      return null;
    }
    return { id: entry.id, label: entry.label, sport: entry.sport };
  } catch {
    return null;
  }
}

export function rememberEvent(entry: RecentEvent): void {
  // Drop the older entry for the same id first, its label may be stale.
  const others = readList(RECENT_EVENTS_KEY).filter((raw) => parseEntry(raw)?.id !== entry.id);
  writeRaw(RECENT_EVENTS_KEY, JSON.stringify(others));
  pushRecent(RECENT_EVENTS_KEY, JSON.stringify(entry), 20);
}

export function clearRecentEvents(): void {
  writeRaw(RECENT_EVENTS_KEY, "[]");
}

export function useRecentEvents(): RecentEvent[] {
  const raw = useStoredRaw(RECENT_EVENTS_KEY);
  return useMemo(() => {
    const entries: RecentEvent[] = [];
    for (const item of parseList(raw)) {
      const entry = parseEntry(item);
      if (null !== entry) {
        entries.push(entry);
      }
    }
    return entries;
  }, [raw]);
}
