"use client";

import { useSyncExternalStore } from "react";

const CHANGE_EVENT = "sofa-event-viewer:storage";

export function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private mode, quota); the in-memory UI still works for this render.
  }
  // `storage` events only reach other tabs, so notify this tab ourselves.
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Raw localStorage string for `key`, kept in sync within this tab and across tabs.
 * `undefined` while prerendering and hydrating, when storage can't be read yet.
 */
export function useStoredRaw(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => undefined,
  );
}

export function readList(key: string): string[] {
  return parseList(readRaw(key));
}

export function parseList(raw: string | null | undefined): string[] {
  if (null === raw || undefined === raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

/** Puts `value` first in the stored most-recent-first list, capped at `limit`. */
export function pushRecent(key: string, value: string, limit: number): void {
  const list = readList(key).filter((v) => v !== value);
  list.unshift(value);
  writeRaw(key, JSON.stringify(list.slice(0, limit)));
}
