"use client";

import { useContext, useEffect, useState } from "react";
import { formatDateTime, sportSlug } from "@/lib/format";
import { RefreshContext } from "@/lib/refresh";
import { isInverse, sidesFor, teamOf } from "@/lib/sides";
import type { Event, Side } from "@/lib/types";
import EntityImage from "./EntityImage";
import { Badge, Toggle } from "./Section";

const POLL_MS = 30_000;

function statusTone(type: string | undefined): "green" | "red" | "zinc" | "amber" {
  if ("inprogress" === type) {
    return "red";
  }
  if ("finished" === type) {
    return "green";
  }
  if ("notstarted" === type) {
    return "zinc";
  }
  return "amber";
}

function TeamBlock({ event, side }: { event: Event; side: Side }) {
  const team = teamOf(event, side);
  const redCards = "home" === side ? event.homeRedCards : event.awayRedCards;
  const winner = ("home" === side && 1 === event.winnerCode) || ("away" === side && 2 === event.winnerCode);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <EntityImage kind="team" id={team?.id} name={team?.name} size={64} />
      <div className={`max-w-full truncate text-base ${winner ? "font-bold" : "font-semibold"}`}>
        {team?.name ?? "?"}
        {undefined !== redCards && redCards > 0 && (
          <span
            className="ml-1.5 inline-block h-3.5 w-2.5 rounded-sm bg-red-600 align-middle"
            title={`${redCards} red card(s)`}
          />
        )}
      </div>
      <div className="text-xs text-zinc-500">
        {side} · <span className="font-mono">{team?.id}</span>
        {team?.nameCode && <> · {team.nameCode}</>}
      </div>
    </div>
  );
}

function scoreText(event: Event, side: Side): string {
  const score = "home" === side ? event.homeScore : event.awayScore;
  const value = score?.display ?? score?.current;
  return undefined === value ? "–" : String(value);
}

/** Polls every 30 s while the event is live and the toggle is on. */
function usePolling(enabled: boolean) {
  const { refresh } = useContext(RefreshContext);
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, refresh]);
}

export default function EventHeader({ event }: { event: Event }) {
  const [left, right] = sidesFor(event);
  const live = "inprogress" === event.status?.type;
  const [poll, setPoll] = useState(true);
  usePolling(live && poll);

  const unique = event.tournament?.uniqueTournament;
  const flags = Object.entries(event)
    .filter(
      ([key, value]) =>
        typeof value === "boolean" &&
        (key.startsWith("has") || key.endsWith("Locked") || "finalResultOnly" === key),
    )
    .map(([key, value]) => ({ key, value: value as boolean }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-zinc-600">
        <EntityImage kind="unique-tournament" id={unique?.id} name={unique?.name} size={20} />
        <span className="font-medium text-zinc-800">{event.tournament?.category?.name}</span>
        <span>›</span>
        <span className="font-medium text-zinc-800">{event.tournament?.name}</span>
        {unique && unique.name !== event.tournament?.name && (
          <span className="text-zinc-500">({unique.name})</span>
        )}
        {event.season && (
          <span>
            · {event.season.name ?? event.season.year}{" "}
            <span className="font-mono text-xs">#{event.season.id}</span>
          </span>
        )}
        {event.roundInfo && <span>· {event.roundInfo.name ?? `Round ${event.roundInfo.round}`}</span>}
      </div>

      <div className="mx-auto flex max-w-3xl items-center gap-4">
        <TeamBlock event={event} side={left} />
        <div className="shrink-0 text-center">
          <div className="text-xs text-zinc-500">{formatDateTime(event.startTimestamp)}</div>
          <div className="my-1 text-5xl font-bold num">
            {scoreText(event, left)}
            <span className="mx-2 text-zinc-300">-</span>
            {scoreText(event, right)}
          </div>
          <Badge tone={statusTone(event.status?.type)}>
            {event.status?.description ?? "?"} ({event.status?.code})
          </Badge>
        </div>
        <TeamBlock event={event} side={right} />
      </div>

      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-sm lg:grid-cols-[max-content_1fr_max-content_1fr]">
        <dt className="text-zinc-500">Ids</dt>
        <dd className="font-mono">
          {event.id} · customId {event.customId} · {event.slug}
        </dd>
        <dt className="text-zinc-500">Sport</dt>
        <dd>{sportSlug(event)}</dd>
        <dt className="text-zinc-500">Status</dt>
        <dd>
          {event.status?.type} · code {event.status?.code} · winnerCode {String(event.winnerCode ?? "–")}
        </dd>
        {event.venue && (
          <>
            <dt className="text-zinc-500">Venue</dt>
            <dd>
              {event.venue.name ?? event.venue.stadium?.name}
              {event.venue.city?.name && `, ${event.venue.city.name}`}
            </dd>
          </>
        )}
        {event.referee && (
          <>
            <dt className="text-zinc-500">Referee</dt>
            <dd>{event.referee.name}</dd>
          </>
        )}
        {event.changes?.changeTimestamp && (
          <>
            <dt className="text-zinc-500">Last change</dt>
            <dd>
              {formatDateTime(event.changes.changeTimestamp)}{" "}
              <span className="font-mono text-xs text-zinc-500">{event.changes.changes?.join(", ")}</span>
            </dd>
          </>
        )}
      </dl>

      <div className="flex flex-wrap items-center gap-1">
        {isInverse(event) && <Badge tone="amber">displayInverseHomeAwayTeams: away shown left</Badge>}
        {flags.map((flag) => (
          <Badge key={flag.key} tone={flag.value ? "blue" : "zinc"}>
            {flag.key}: {String(flag.value)}
          </Badge>
        ))}
        {unique?.hasEventPlayerStatistics !== undefined && (
          <Badge tone={unique.hasEventPlayerStatistics ? "blue" : "zinc"}>
            ut.hasEventPlayerStatistics: {String(unique.hasEventPlayerStatistics)}
          </Badge>
        )}
        {unique?.hasBoxScore !== undefined && (
          <Badge tone={unique.hasBoxScore ? "blue" : "zinc"}>
            ut.hasBoxScore: {String(unique.hasBoxScore)}
          </Badge>
        )}
      </div>

      {live && (
        <Toggle label={`Poll every ${POLL_MS / 1000} s while live`} checked={poll} onChange={setPoll} />
      )}
    </div>
  );
}
