"use client";

import { formatSeconds, periodColumns } from "@/lib/format";
import { sidesFor, teamOf } from "@/lib/sides";
import type { Event } from "@/lib/types";

/** Period durations live in `event.time` under the same key, in seconds. */
function duration(event: Event, key: string): string {
  const value = event.time?.[key];
  if (undefined === value) {
    return "";
  }
  return formatSeconds(value);
}

const SHORT_LABELS: Record<string, string> = {
  overtime: "OT",
  penalties: "PEN",
  extra1: "ET1",
  extra2: "ET2",
  normaltime: "NT",
  current: "Cur",
  display: "Disp",
};

/** Narrow column headers like the real site's: 1, 2, 3, 4, OT. */
function shortLabel(key: string): string {
  const period = /^period(\d+)$/.exec(key);
  if (null !== period) {
    return period[1];
  }
  return SHORT_LABELS[key] ?? key;
}

export default function PeriodScores({ event }: { event: Event }) {
  const columns = periodColumns(event);
  const sides = sidesFor(event);
  const timeEntries = Object.entries(event.time ?? {});

  if (0 === columns.length) {
    return <p className="text-sm text-zinc-500">No score keys on this event.</p>;
  }

  const hasDurations = columns.some((c) => undefined !== event.time?.[c.key]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
              <th className="py-1.5 pr-4 font-medium">Team</th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-1.5 py-1.5 text-right font-medium"
                  title={`${c.label} (${c.key})`}
                >
                  {shortLabel(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sides.map((side) => {
              const score = "home" === side ? event.homeScore : event.awayScore;
              return (
                <tr key={side} className="border-b border-zinc-100 odd:bg-zinc-50">
                  <td className="max-w-32 truncate py-1.5 pr-3" title={teamOf(event, side)?.name}>
                    {teamOf(event, side)?.name ?? side}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-1.5 py-1.5 text-right num">
                      {score?.[c.key] ?? <span className="text-zinc-300">–</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
            {hasDurations && (
              <tr className="text-xs text-zinc-500">
                <td className="py-1.5 pr-4">Duration</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-1.5 py-1.5 text-right num">
                    {duration(event, c.key)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>
          defaultPeriodCount <span className="num text-zinc-800">{event.defaultPeriodCount ?? "–"}</span>
        </span>
        <span>
          defaultPeriodLength <span className="num text-zinc-800">{event.defaultPeriodLength ?? "–"}</span>
        </span>
        <span>
          defaultOvertimeLength{" "}
          <span className="num text-zinc-800">{event.defaultOvertimeLength ?? "–"}</span>
        </span>
        {null === event.periods || undefined === event.periods ? (
          <span>no `periods` map, showing every score key</span>
        ) : null}
      </div>
      {timeEntries.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span className="font-medium">event.time:</span>
          {timeEntries.map(([key, value]) => (
            <span key={key}>
              {key} <span className="num text-zinc-800">{value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
