"use client";

import { useMemo } from "react";
import { parseList, pushRecent, readRaw, useStoredRaw, writeRaw } from "./storage";

export const API_BASE_KEY = "sofa-event-viewer:apiBase";
export const RECENT_BASES_KEY = "sofa-event-viewer:recentBases";
export const DEFAULT_API_BASE = "https://www.sofascore.com/api/v1";
export const PRODUCTION_IMAGES_BASE = "https://img.sofascore.com/api/v1";

export const PRESETS: { label: string; base: string }[] = [
  { label: "production", base: DEFAULT_API_BASE },
  { label: "master.dev", base: "https://master.dev.sofascore.dev/api/v1" },
];

/**
 * Accepts `host`, `https://host`, `https://host/` or `https://host/api/v1/` and returns
 * `https://host/api/v1`. Throws with a user-facing message on anything else.
 */
export function normaliseApiBase(input: string): string {
  let value = input.trim();
  if ("" === value) {
    throw new Error("Enter a backend host or URL.");
  }
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`"${input}" is not a valid URL.`);
  }
  if ("http:" !== url.protocol && "https:" !== url.protocol) {
    throw new Error(`Only http(s) backends are supported, got ${url.protocol}`);
  }
  if (!url.hostname.includes(".") && "localhost" !== url.hostname) {
    throw new Error(`"${url.hostname}" does not look like a host name.`);
  }

  const path = url.pathname.replace(/\/+$/, "");
  const apiPath = path.endsWith("/api/v1") ? path : `${path}/api/v1`;

  return `${url.protocol}//${url.host}${apiPath}`;
}

function safeNormalise(raw: string | null): string {
  if (null === raw) {
    return DEFAULT_API_BASE;
  }
  try {
    return normaliseApiBase(raw);
  } catch {
    return DEFAULT_API_BASE;
  }
}

export function readApiBase(): string {
  return safeNormalise(readRaw(API_BASE_KEY));
}

/** Normalises, stores and broadcasts the new base. Throws on invalid input. */
export function setApiBase(input: string): string {
  const base = normaliseApiBase(input);
  writeRaw(API_BASE_KEY, base);
  pushRecent(RECENT_BASES_KEY, base, 8);
  return base;
}

/**
 * The selected base, or `null` until hydration has read localStorage. Callers wait on `null`
 * instead of assuming the default, which would send the first requests to production.
 */
export function useApiBase(): string | null {
  const raw = useStoredRaw(API_BASE_KEY);
  if (undefined === raw) {
    return null;
  }
  return safeNormalise(raw);
}

export function useRecentBases(): string[] {
  const raw = useStoredRaw(RECENT_BASES_KEY);
  return useMemo(() => parseList(raw), [raw]);
}

export function isProductionBase(base: string): boolean {
  return DEFAULT_API_BASE === base || "https://api.sofascore.com/api/v1" === base;
}

/** Production serves images from img.sofascore.com; every other backend serves them itself. */
export function imagesBaseFor(base: string): string {
  if (isProductionBase(base)) {
    return PRODUCTION_IMAGES_BASE;
  }
  return base;
}

/** `?api=` value for a base: just the host for the usual `https://host/api/v1`. */
export function shareParam(base: string): string {
  const url = new URL(base);
  if ("https:" === url.protocol && "/api/v1" === url.pathname) {
    return url.host;
  }
  return base;
}

/**
 * `?api=<url>` in the page URL overrides the stored base, so a shared link opens on the sender's backend.
 * Runs at module load so no section ever fetches against the previous base.
 */
function applyApiOverride(): void {
  const url = new URL(window.location.href);
  const override = url.searchParams.get("api");
  if (null === override) {
    return;
  }
  try {
    setApiBase(override);
  } catch (e) {
    console.warn("Ignoring invalid ?api= override", e);
  }
}

if (typeof window !== "undefined") {
  applyApiOverride();
}
