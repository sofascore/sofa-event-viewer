"use client";

import type { ReactNode } from "react";
import type { ApiResult } from "@/lib/useApi";
import RawJson from "./RawJson";

export function ResultMeta({ result }: { result: ApiResult<unknown> }) {
  if (!result.url) {
    return null;
  }
  return (
    <span className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
      <a
        href={result.url}
        target="_blank"
        rel="noreferrer"
        className="truncate font-mono hover:text-blue-700 hover:underline"
        title={result.url}
      >
        {result.url}
      </a>
      {"ok" === result.status && (
        <span className="shrink-0 num">
          {result.httpStatus} · {result.ms} ms
        </span>
      )}
    </span>
  );
}

export function ResultState({ result, emptyText }: { result: ApiResult<unknown>; emptyText?: string }) {
  if ("loading" === result.status) {
    return (
      <div className="space-y-2 py-2" aria-busy="true">
        <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-200" />
      </div>
    );
  }
  if ("error" === result.status) {
    if (404 === result.httpStatus) {
      return <p className="py-2 text-sm text-zinc-500">Not available for this event (404).</p>;
    }
    return (
      <div
        data-section-error
        className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        <span className="font-semibold">
          {null === result.httpStatus ? "Request failed" : `HTTP ${result.httpStatus}`}
        </span>
        {": "}
        {result.error}
        <span className="ml-2 text-xs text-red-600 num">after {result.ms} ms</span>
      </div>
    );
  }
  if ("ok" === result.status && undefined !== emptyText) {
    return <p className="py-2 text-sm text-zinc-500">{emptyText}</p>;
  }
  return null;
}

interface SectionProps<T> {
  title: string;
  result: ApiResult<T>;
  /** Renders the data; return null to show `emptyText`. */
  children: (data: T) => ReactNode;
  emptyText?: string;
  actions?: ReactNode;
  id?: string;
  /** What the raw JSON view shows, when not the whole response. */
  raw?: (data: T) => unknown;
  /** Without the card and title, for use inside a TabCard. */
  bare?: boolean;
}

export const CARD = "rounded-2xl bg-white p-4 shadow-[0_1px_4px_rgba(34,34,38,0.08)]";

/**
 * Title, endpoint link, loading/error/empty states and the raw response for one API call.
 * A 404 reads as "not available", not as an error.
 */
export default function Section<T>({
  title,
  result,
  children,
  emptyText = "Empty.",
  actions,
  id,
  raw,
  bare = false,
}: SectionProps<T>) {
  const body = "ok" === result.status ? children(result.data) : null;

  return (
    <section id={id} className={bare ? "" : CARD}>
      <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {!bare && <h2 className="text-base font-bold">{title}</h2>}
        <ResultMeta result={result} />
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </header>
      {"ok" === result.status ? (
        (body ?? <ResultState result={result} emptyText={emptyText} />)
      ) : (
        <ResultState result={result} />
      )}
      {"ok" === result.status && <RawJson data={raw ? raw(result.data) : result.data} />}
      {"error" === result.status && 404 !== result.httpStatus && null !== result.httpStatus && (
        <p className="mt-2 text-xs text-zinc-500">
          Open the endpoint link above to see the raw error response.
        </p>
      )}
    </section>
  );
}

export function Badge({
  children,
  tone = "zinc",
}: {
  children: ReactNode;
  tone?: "zinc" | "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-block rounded border px-1.5 py-px text-[11px] font-medium leading-4 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-zinc-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Tabs<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: K; label: string }[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tab.key === active ? "bg-sofa text-white" : "bg-sofa-soft text-sofa hover:bg-sofa/20"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
