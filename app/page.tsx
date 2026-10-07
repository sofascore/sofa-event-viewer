"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { clearRecentEvents, useRecentEvents } from "@/lib/recentEvents";
import { resolveEventId } from "@/lib/resolveEvent";

const REFERENCE_EVENTS = [
  { id: 17126272, label: "Vojvodina 78–62 ŽKK Mega Superbet (basketball, Serbian 1. ŽLS)" },
  { id: 16363867, label: "Manchester City 5–3 Sunderland (football, Premier League)" },
];

export default function Home() {
  const router = useRouter();
  const recent = useRecentEvents();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const open = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResolving(true);
    const resolved = await resolveEventId(input);
    setResolving(false);
    if ("error" in resolved) {
      setError(resolved.error);
      return;
    }
    router.push(`/event/?id=${resolved.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <section className="rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(34,34,38,0.08)]">
        <h1 className="mb-1 text-lg font-semibold">Open an event</h1>
        <p className="mb-3 text-sm text-zinc-600">
          Event id, sofascore.com match URL (with or without <code className="font-mono">#id:…</code>) or
          customId.
        </p>
        <form onSubmit={open} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="17126272, rQ or https://www.sofascore.com/football/match/…#id:16363867"
            className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 font-mono text-sm"
            autoFocus
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={resolving}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {resolving ? "Resolving…" : "Open"}
          </button>
        </form>
        {null !== error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(34,34,38,0.08)]">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-semibold">Recently opened</h2>
          {recent.length > 0 && (
            <button
              type="button"
              onClick={clearRecentEvents}
              className="text-xs text-zinc-500 hover:text-red-700"
            >
              Clear
            </button>
          )}
        </div>
        {0 === recent.length ? (
          <p className="text-sm text-zinc-500">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recent.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/event/?id=${event.id}`}
                  className="flex gap-3 py-1.5 text-sm hover:text-blue-700"
                >
                  <span className="w-20 shrink-0 font-mono text-zinc-500">{event.id}</span>
                  <span className="truncate">{event.label}</span>
                  {event.sport && (
                    <span className="ml-auto shrink-0 text-xs text-zinc-400">{event.sport}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-[0_1px_4px_rgba(34,34,38,0.08)]">
        <h2 className="mb-2 font-semibold">Reference events</h2>
        <ul className="divide-y divide-zinc-100">
          {REFERENCE_EVENTS.map((event) => (
            <li key={event.id}>
              <Link href={`/event/?id=${event.id}`} className="flex gap-3 py-1.5 text-sm hover:text-blue-700">
                <span className="w-20 shrink-0 font-mono text-zinc-500">{event.id}</span>
                <span>{event.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
