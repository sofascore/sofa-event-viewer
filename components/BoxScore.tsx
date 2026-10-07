"use client";

import { useState } from "react";
import { boxScoreColumns, sumStatistics, type StatColumn } from "@/lib/boxScore";
import { sportSlug } from "@/lib/format";
import { sidesFor, teamOf } from "@/lib/sides";
import type { Event, LineupPlayer, LineupsResponse, Side } from "@/lib/types";
import EntityImage from "./EntityImage";
import PlayerDrawer from "./PlayerDrawer";
import { Badge } from "./Section";

type Sort = { column: string; desc: boolean } | null;

function sortPlayers(players: LineupPlayer[], columns: StatColumn[], sort: Sort): LineupPlayer[] {
  if (null === sort) {
    return players;
  }
  const column = columns.find((c) => c.id === sort.column);
  if (undefined === column) {
    return players;
  }
  const value = (p: LineupPlayer) => column.sortValue(p.statistics ?? {});
  return [...players].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (null === va && null === vb) {
      return 0;
    }
    // Players without the stat go last whichever the direction.
    if (null === va) {
      return 1;
    }
    if (null === vb) {
      return -1;
    }
    return sort.desc ? vb - va : va - vb;
  });
}

/** Compares summed player points (basketball) or goals (football) with the event score. */
function scoreCheck(event: Event, side: Side, totals: Record<string, unknown>, sport: string | undefined) {
  const score = ("home" === side ? event.homeScore : event.awayScore)?.current;
  if (undefined === score) {
    return null;
  }
  const key = "basketball" === sport ? "points" : "goals";
  const sum = totals[key];
  if (typeof sum !== "number") {
    if ("football" === sport) {
      // Football statistics omit `goals` for players who didn't score, so no key means 0.
      return { key, sum: 0, score, ok: 0 === score };
    }
    return null;
  }
  return { key, sum, score, ok: sum === score };
}

function TeamTable({
  event,
  side,
  players,
  sport,
  onPlayer,
}: {
  event: Event;
  side: Side;
  players: LineupPlayer[];
  sport: string | undefined;
  onPlayer: (p: LineupPlayer) => void;
}) {
  const [sort, setSort] = useState<Sort>(null);
  const columns = boxScoreColumns(sport, players);
  const starters = sortPlayers(
    players.filter((p) => !p.substitute),
    columns,
    sort,
  );
  const bench = sortPlayers(
    players.filter((p) => p.substitute),
    columns,
    sort,
  );
  const totals = sumStatistics(players);
  const check = scoreCheck(event, side, totals, sport);
  const team = teamOf(event, side);
  const withStats = players.filter((p) => p.statistics && Object.keys(p.statistics).length > 0).length;

  const toggleSort = (id: string) => {
    if (sort?.column !== id) {
      setSort({ column: id, desc: true });
    } else if (sort.desc) {
      setSort({ column: id, desc: false });
    } else {
      setSort(null);
    }
  };

  const row = (p: LineupPlayer) => (
    <tr
      key={p.player?.id ?? p.player?.name}
      className="border-b border-zinc-100 odd:bg-zinc-50 hover:bg-blue-50"
    >
      <td className="sticky left-0 z-[1] bg-inherit py-1 pr-3">
        <button
          type="button"
          onClick={() => onPlayer(p)}
          className="flex items-center gap-2 text-left hover:text-blue-700 hover:underline"
          title={`Player id ${p.player?.id}: open per-player statistics`}
        >
          <span className="w-6 shrink-0 text-right text-xs text-zinc-400 num">
            {p.jerseyNumber ?? p.shirtNumber}
          </span>
          <span className="whitespace-nowrap">{p.player?.name ?? "?"}</span>
          {p.captain && <Badge>C</Badge>}
          {(p.position ?? p.player?.position) && (
            <span className="text-xs text-zinc-400">{p.position ?? p.player?.position}</span>
          )}
        </button>
      </td>
      {columns.map((c) => (
        <td key={c.id} className="whitespace-nowrap px-2 py-1 text-right num">
          {c.render(p.statistics ?? {})}
        </td>
      ))}
    </tr>
  );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <EntityImage kind="team" id={team?.id} name={team?.name} size={20} />
        <h3 className="font-semibold">{team?.name ?? side}</h3>
        <span className="text-xs text-zinc-500">
          {players.length} players ({starters.length} starters, {bench.length} bench) · {withStats} with
          statistics
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs text-zinc-500">
              <th className="sticky left-0 z-[1] bg-white py-1.5 pr-3 text-left font-medium">Player</th>
              {columns.map((c) => (
                <th key={c.id} className="whitespace-nowrap px-2 py-1.5 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(c.id)}
                    title={c.keys.join(" / ")}
                    className="hover:text-zinc-900"
                  >
                    {c.label}
                    {sort?.column === c.id && (sort.desc ? " ↓" : " ↑")}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {starters.map(row)}
            {bench.length > 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="pb-0.5 pt-2 text-xs font-medium uppercase text-zinc-400"
                >
                  Bench
                </td>
              </tr>
            )}
            {bench.map(row)}
            <tr className="border-t-2 border-zinc-300 font-semibold">
              <td className="sticky left-0 z-[1] bg-white py-1 pr-3">Totals (listed players)</td>
              {columns.map((c) => (
                <td key={c.id} className="whitespace-nowrap px-2 py-1 text-right num">
                  {c.summable ? c.render(totals) : ""}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {null !== check && (
        <p className={`mt-1 text-xs ${check.ok ? "text-zinc-500" : "font-medium text-red-700"}`}>
          Sum of player {check.key} {check.sum} {check.ok ? "=" : "≠"} score {check.score}
          {!check.ok && "football" === sport && " (own goals count for the other side)"}
        </p>
      )}
    </div>
  );
}

export default function BoxScore({ event, lineups }: { event: Event; lineups: LineupsResponse }) {
  const [selected, setSelected] = useState<LineupPlayer | null>(null);
  const sport = sportSlug(event);
  const sides = sidesFor(event);

  const anyStats = sides.some((side) => (lineups[side]?.players ?? []).some((p) => p.statistics));
  if (!anyStats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {sides.map((side) => (
        <TeamTable
          key={side}
          event={event}
          side={side}
          players={lineups[side]?.players ?? []}
          sport={sport}
          onPlayer={setSelected}
        />
      ))}
      {null !== selected && undefined !== event.id && (
        <PlayerDrawer eventId={event.id} lineupPlayer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
