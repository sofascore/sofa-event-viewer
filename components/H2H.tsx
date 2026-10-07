"use client";

import { sportSlug } from "@/lib/format";
import { sidesFor, teamOf } from "@/lib/sides";
import type { Duel, Event, EventsResponse, H2HResponse } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import EventList from "./EventList";
import RawJson from "./RawJson";
import { ResultMeta, ResultState } from "./Section";

function DuelBar({
  title,
  duel,
  event,
  showDraws,
}: {
  title: string;
  duel: Duel;
  event: Event;
  showDraws: boolean;
}) {
  const [left, right] = sidesFor(event);
  const wins = { home: duel.homeWins ?? 0, away: duel.awayWins ?? 0 };
  const draws = duel.draws ?? 0;
  const total = wins.home + wins.away + draws;
  const pct = (n: number) => (0 === total ? 0 : (n / total) * 100);

  return (
    <div>
      <div className="mb-1 text-xs font-medium text-zinc-500">{title}</div>
      <div className="flex items-center justify-between text-sm">
        <span>
          <span className="text-lg font-bold text-blue-700 num">{wins[left]}</span>{" "}
          <span className="text-zinc-500">{teamOf(event, left)?.name} wins</span>
        </span>
        {showDraws && (
          <span>
            <span className="text-lg font-bold num">{draws}</span>{" "}
            <span className="text-zinc-500">draws</span>
          </span>
        )}
        <span>
          <span className="text-zinc-500">{teamOf(event, right)?.name} wins</span>{" "}
          <span className="text-lg font-bold text-orange-600 num">{wins[right]}</span>
        </span>
      </div>
      <div className="mt-1 flex h-2 overflow-hidden rounded bg-zinc-100">
        <div className="bg-blue-600" style={{ width: `${pct(wins[left])}%` }} />
        <div className="bg-zinc-400" style={{ width: `${pct(draws)}%` }} />
        <div className="bg-orange-500" style={{ width: `${pct(wins[right])}%` }} />
      </div>
    </div>
  );
}

export default function H2H({ event, data }: { event: Event; data: H2HResponse }) {
  // The h2h events endpoint takes the customId, not the numeric id.
  const eventsResult = useApi<EventsResponse>(
    undefined === event.customId ? null : `/event/${encodeURIComponent(event.customId)}/h2h/events`,
  );
  const showDraws = "basketball" !== sportSlug(event) || (data.teamDuel?.draws ?? 0) > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-6 md:grid-cols-2">
        {data.teamDuel ? (
          <DuelBar title="Team duel" duel={data.teamDuel} event={event} showDraws={showDraws} />
        ) : (
          <p className="text-sm text-zinc-500">No teamDuel.</p>
        )}
        {data.managerDuel && (
          <DuelBar title="Manager duel" duel={data.managerDuel} event={event} showDraws={showDraws} />
        )}
      </div>

      <div className="border-t border-zinc-100 pt-3">
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <h3 className="text-sm font-semibold">Previous meetings</h3>
          {"ok" === eventsResult.status && (
            <span className="text-xs text-zinc-500">{eventsResult.data.events?.length ?? 0} events</span>
          )}
          <ResultMeta result={eventsResult} />
        </div>
        {undefined === event.customId && <p className="text-sm text-zinc-500">Event has no customId.</p>}
        {"ok" === eventsResult.status ? (
          <>
            <EventList events={eventsResult.data.events ?? []} highlightTeamId={event.homeTeam?.id} />
            <RawJson data={eventsResult.data} />
          </>
        ) : (
          <ResultState result={eventsResult} />
        )}
      </div>
    </div>
  );
}
