"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState, type FormEvent } from "react";
import { PRESETS, isProductionBase, setApiBase, shareParam, useApiBase, useRecentBases } from "@/lib/apiBase";
import { RefreshContext } from "@/lib/refresh";
import { resolveEventId } from "@/lib/resolveEvent";
import { useApi } from "@/lib/useApi";

function StatusDot({ eventId }: { eventId: string | null }) {
  const result = useApi<unknown>(null === eventId ? null : `/event/${eventId}`);

  let color = "bg-zinc-300";
  let title = "Open an event to check this backend";
  if ("loading" === result.status) {
    color = "bg-amber-400 animate-pulse";
    title = `Requesting ${result.url}`;
  } else if ("ok" === result.status) {
    color = "bg-green-500";
    title = `${result.url} → ${result.httpStatus} in ${result.ms} ms`;
  } else if ("error" === result.status && 404 === result.httpStatus) {
    // The backend answered, the event just isn't there.
    color = "bg-green-500";
    title = `${result.url} → 404 (backend reachable, event not found)`;
  } else if ("error" === result.status) {
    color = "bg-red-500";
    title = `${result.url} → ${result.error}`;
  }

  return (
    <span
      className={`inline-block h-3 w-3 shrink-0 rounded-full ${color}`}
      title={title}
      aria-label={title}
    />
  );
}

/** Jump to another event: id, sofascore.com match URL or customId. */
function EventSearch({ onError }: { onError: (message: string | null) => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if ("" === value.trim()) {
      return;
    }
    onError(null);
    setBusy(true);
    const resolved = await resolveEventId(value);
    setBusy(false);
    if ("error" in resolved) {
      onError(resolved.error);
      return;
    }
    setValue("");
    router.push(`/event/?id=${resolved.id}`);
  };

  return (
    <form onSubmit={submit} className="flex items-center">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={busy ? "Resolving…" : "Event id, URL or customId"}
        disabled={busy}
        aria-label="Open event"
        spellCheck={false}
        className="w-52 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-sm focus:border-sofa focus:bg-white focus:outline-none"
      />
    </form>
  );
}

export default function BackendBar() {
  const base = useApiBase();
  const recent = useRecentBases();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const { refresh } = useContext(RefreshContext);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  // Mirror the base into ?api= after every base change or navigation, so the address bar is shareable.
  useEffect(() => {
    if (null === base) {
      return;
    }
    const url = new URL(window.location.href);
    const wanted = shareParam(base);
    if (url.searchParams.get("api") === wanted) {
      return;
    }
    url.searchParams.set("api", wanted);
    window.history.replaceState(window.history.state, "", url.toString());
  }, [base, pathname, searchParams]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const apply = (value: string) => {
    try {
      setApiBase(value);
      setDraft(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    apply(draft ?? base ?? "");
  };

  const choices = [
    ...PRESETS,
    ...recent
      .filter((r) => !PRESETS.some((p) => p.base === r))
      .map((r) => ({ label: new URL(r).host, base: r })),
  ];

  const production = null !== base && isProductionBase(base);

  return (
    <div
      className={`sticky top-0 z-20 border-b shadow-sm ${
        production ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
        <Link href="/" className="font-semibold text-zinc-900 hover:text-blue-700">
          Event viewer
        </Link>

        <EventSearch onError={setSearchError} />

        <div className="flex min-w-0 items-center gap-2">
          <StatusDot eventId={eventId} />
          <span className="truncate font-mono text-sm font-semibold" title="Current backend">
            {base ?? "…"}
          </span>
          {production && (
            <span className="rounded bg-amber-200 px-1.5 text-xs font-semibold text-amber-900">PROD</span>
          )}
          <button
            type="button"
            onClick={refresh}
            className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs hover:bg-zinc-100"
            title="Re-fetch every section (backend responses are cached for ~10 s)"
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs hover:bg-zinc-100"
            title="Copy this page's link, including the backend"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        <form onSubmit={submit} className="flex min-w-[20rem] flex-1 items-center gap-2">
          <input
            value={draft ?? base ?? ""}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="branch.dev.sofascore.dev or https://host/api/v1"
            className={`min-w-0 flex-1 rounded border px-2 py-1 font-mono text-sm ${
              null === error ? "border-zinc-300" : "border-red-400 bg-red-50"
            }`}
            aria-label="Backend base URL"
            spellCheck={false}
          />
          <button
            type="submit"
            className="rounded bg-zinc-800 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Apply
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1">
          {choices.map((choice) => (
            <button
              key={choice.base}
              type="button"
              onClick={() => apply(choice.base)}
              title={choice.base}
              className={`rounded px-2 py-0.5 text-xs ${
                choice.base === base
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
      {null !== error && <div className="mx-auto max-w-7xl px-4 pb-2 text-sm text-red-700">{error}</div>}
      {null !== searchError && (
        <div className="mx-auto max-w-7xl px-4 pb-2 text-sm text-red-700">{searchError}</div>
      )}
    </div>
  );
}
