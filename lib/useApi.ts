"use client";

import { useContext, useEffect, useState } from "react";
import { useApiBase } from "./apiBase";
import { RefreshContext } from "./refresh";

export const TIMEOUT_MS = 20_000;

export type ApiResult<T> =
  | { status: "idle"; url: null }
  | { status: "loading"; url: string }
  | { status: "ok"; url: string; data: T; httpStatus: number; ms: number }
  | { status: "error"; url: string; error: string; httpStatus: number | null; ms: number };

type Settled<T> = Extract<ApiResult<T>, { status: "ok" | "error" }>;

const inFlight = new Map<string, Promise<Settled<unknown>>>();

// Keep bursts small on every backend: production sits behind Cloudflare and dev boxes are shared.
const MAX_CONCURRENT = 2;
// Settled responses are reused until the refresh tick changes or they age out.
const CACHE_MS = 30_000;
const cache = new Map<string, { at: number; result: Settled<unknown> }>();

const slots = new Map<string, { active: number; queue: (() => void)[] }>();

async function withSlot<T>(base: string, run: () => Promise<T>): Promise<T> {
  const limit = MAX_CONCURRENT;
  let slot = slots.get(base);
  if (undefined === slot) {
    slot = { active: 0, queue: [] };
    slots.set(base, slot);
  }
  const s = slot;
  if (s.active >= limit) {
    await new Promise<void>((resolve) => s.queue.push(resolve));
  }
  s.active++;
  try {
    return await run();
  } finally {
    s.active--;
    s.queue.shift()?.();
  }
}

function errorMessage(body: unknown, fallback: string): string {
  if (typeof body !== "object" || null === body) {
    return fallback;
  }
  const error = (body as { error?: { message?: unknown } }).error;
  const message = error?.message;
  if (typeof message !== "string") {
    return fallback;
  }
  return message;
}

function request<T>(base: string, url: string): Promise<Settled<T>> {
  // The timeout starts once a slot is free, so queued requests don't expire unsent.
  return withSlot(base, () => send<T>(url));
}

async function send<T>(url: string): Promise<Settled<T>> {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // No custom headers: a simple GET skips the CORS preflight.
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    const ms = Math.round(performance.now() - started);
    let body: unknown = null;
    try {
      body = "" === text ? null : JSON.parse(text);
    } catch {
      if (response.ok) {
        return { status: "error", url, error: "Response is not JSON", httpStatus: response.status, ms };
      }
    }
    if (!response.ok) {
      const error = errorMessage(body, response.statusText || `HTTP ${response.status}`);
      return { status: "error", url, error, httpStatus: response.status, ms };
    }
    return { status: "ok", url, data: body as T, httpStatus: response.status, ms };
  } catch (e) {
    const ms = Math.round(performance.now() - started);
    if (controller.signal.aborted) {
      return { status: "error", url, error: `Timed out after ${TIMEOUT_MS / 1000} s`, httpStatus: null, ms };
    }
    const reason = e instanceof Error ? e.message : String(e);
    return {
      status: "error",
      url,
      error: `Network error (host down, DNS or CORS): ${reason}`,
      httpStatus: null,
      ms,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function fetchApi<T>(base: string, path: string, tick = 0): Promise<Settled<T>> {
  const url = `${base}${path}`;
  const key = `${tick}|${url}`;
  const cached = cache.get(key);
  if (undefined !== cached && Date.now() - cached.at < CACHE_MS) {
    return Promise.resolve(cached.result as Settled<T>);
  }
  let promise = inFlight.get(key);
  if (undefined === promise) {
    promise = request<unknown>(base, url)
      .then((result) => {
        cache.set(key, { at: Date.now(), result });
        return result;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
  }
  return promise as Promise<Settled<T>>;
}

/**
 * GETs `path` from the selected backend. Pass `null` to wait (e.g. for an id from another request).
 * While a refresh is running the previous result stays on screen.
 */
export function useApi<T>(path: string | null): ApiResult<T> {
  const base = useApiBase();
  const { tick } = useContext(RefreshContext);
  const url = null === path || null === base ? null : `${base}${path}`;
  const [result, setResult] = useState<ApiResult<T>>({ status: "idle", url: null });

  useEffect(() => {
    if (null === path || null === base) {
      return;
    }
    let cancelled = false;
    fetchApi<T>(base, path, tick).then((settled) => {
      if (!cancelled) {
        setResult(settled);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [base, path, tick]);

  if (null === path) {
    return { status: "idle", url: null };
  }
  if (null === url) {
    return { status: "loading", url: "" };
  }
  // A result for another URL (base or path changed) is stale: show loading instead.
  if (result.url !== url) {
    return { status: "loading", url };
  }
  return result;
}
