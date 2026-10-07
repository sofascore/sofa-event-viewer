"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Event } from "@/lib/types";

function score(event: Event): string {
  const home = event.homeScore?.display ?? event.homeScore?.current;
  const away = event.awayScore?.display ?? event.awayScore?.current;
  if (undefined === home && undefined === away) {
    return "–";
  }
  return `${home ?? "–"}:${away ?? "–"}`;
}

/** Events newest first with a link to open each one in the viewer. */
export default function EventList({
  events,
  highlightTeamId,
}: {
  events: Event[];
  highlightTeamId?: number;
}) {
  if (0 === events.length) {
    return <p className="text-sm text-zinc-500">No events.</p>;
  }
  const sorted = [...events].sort((a, b) => (b.startTimestamp ?? 0) - (a.startTimestamp ?? 0));
  return (
    <table className="w-full text-sm">
      <tbody>
        {sorted.map((e) => {
          const homeWon = 1 === e.winnerCode;
          const awayWon = 2 === e.winnerCode;
          return (
            <tr key={e.id} className="border-b border-zinc-100 odd:bg-zinc-50">
              <td className="whitespace-nowrap py-1 pr-3 text-xs text-zinc-500 num">
                {formatDate(e.startTimestamp)}
              </td>
              <td className="hidden max-w-48 truncate py-1 pr-3 text-xs text-zinc-500 md:table-cell">
                {e.tournament?.name}
              </td>
              <td
                className={`py-1 pr-2 text-right ${homeWon ? "font-semibold" : ""} ${
                  highlightTeamId === e.homeTeam?.id ? "text-blue-700" : ""
                }`}
              >
                {e.homeTeam?.name}
              </td>
              <td className="whitespace-nowrap px-2 py-1 text-center font-semibold num">{score(e)}</td>
              <td
                className={`py-1 pl-2 ${awayWon ? "font-semibold" : ""} ${
                  highlightTeamId === e.awayTeam?.id ? "text-blue-700" : ""
                }`}
              >
                {e.awayTeam?.name}
              </td>
              <td className="whitespace-nowrap py-1 pl-2 text-xs text-zinc-500">{e.status?.description}</td>
              <td className="py-1 pl-2 text-right">
                <Link href={`/event/?id=${e.id}`} className="font-mono text-xs text-blue-700 hover:underline">
                  {e.id}
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
