"use client";

import { formatValue } from "@/lib/format";
import { sidesFor, teamOf } from "@/lib/sides";
import type { Event, LineupPlayer, LineupTeam, LineupsResponse, Side } from "@/lib/types";
import EntityImage from "./EntityImage";
import { Badge } from "./Section";

/** Goalkeeper, then formation rows from the starters in API order, as the real getFormationMatrix does. */
function formationRows(formation: string, starters: LineupPlayer[]): LineupPlayer[][] | null {
  const sizes = formation.split("-").map(Number);
  if (sizes.some((n) => !Number.isInteger(n) || n <= 0)) {
    return null;
  }
  if (1 + sizes.reduce((a, b) => a + b, 0) !== starters.length) {
    return null;
  }
  const rows: LineupPlayer[][] = [starters.slice(0, 1)];
  let offset = 1;
  for (const size of sizes) {
    rows.push(starters.slice(offset, offset + size));
    offset += size;
  }
  return rows;
}

function PlayerRow({ p }: { p: LineupPlayer }) {
  const rating = p.statistics?.rating;
  return (
    <li className="flex items-center gap-2 py-1 text-sm odd:bg-zinc-50">
      <span className="w-7 shrink-0 text-right text-xs text-zinc-400 num">
        {p.jerseyNumber ?? p.shirtNumber ?? ""}
      </span>
      <span className="truncate">{p.player?.name ?? "?"}</span>
      {p.captain && <Badge tone="amber">C</Badge>}
      <span className="text-xs text-zinc-500">{p.position ?? p.player?.position ?? ""}</span>
      <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-zinc-400">
        {undefined !== rating && <span className="text-zinc-700 num">{formatValue(rating)}</span>}
        {undefined !== p.avgRating && <span title="avgRating">avg {formatValue(p.avgRating)}</span>}
        <span className="font-mono">{p.player?.id}</span>
      </span>
    </li>
  );
}

function TeamColumn({ event, side, team }: { event: Event; side: Side; team: LineupTeam | undefined }) {
  const players = team?.players ?? [];
  const starters = players.filter((p) => !p.substitute);
  const subs = players.filter((p) => p.substitute);
  const formation = team?.formation ?? null;
  const rows = null === formation ? null : formationRows(formation, starters);
  const info = teamOf(event, side);

  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <EntityImage kind="team" id={info?.id} name={info?.name} size={22} />
        <h3 className="font-semibold">{info?.name ?? side}</h3>
        {formation && <Badge tone="blue">{formation}</Badge>}
        <span className="text-xs text-zinc-500">
          {players.length} players · {starters.length} starters · {subs.length} subs
        </span>
        {team?.playerColor?.primary && (
          <span
            className="inline-block h-3 w-3 rounded-sm border border-zinc-300"
            style={{ background: `#${team.playerColor.primary}` }}
            title={`playerColor ${JSON.stringify(team.playerColor)}`}
          />
        )}
      </div>

      {null !== rows && (
        <div className="mb-3 space-y-1 rounded bg-green-50 p-2 text-xs">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-center gap-3">
              {row.map((p) => (
                <span key={p.player?.id} className="whitespace-nowrap">
                  <span className="text-zinc-400 num">{p.jerseyNumber ?? p.shirtNumber}</span>{" "}
                  {p.player?.shortName ?? p.player?.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      <h4 className="text-xs font-medium uppercase text-zinc-400">Starters</h4>
      <ul>
        {starters.map((p) => (
          <PlayerRow key={p.player?.id ?? p.player?.name} p={p} />
        ))}
      </ul>
      {subs.length > 0 && (
        <>
          <h4 className="mt-3 text-xs font-medium uppercase text-zinc-400">Substitutes</h4>
          <ul>
            {subs.map((p) => (
              <PlayerRow key={p.player?.id ?? p.player?.name} p={p} />
            ))}
          </ul>
        </>
      )}
      {(team?.missingPlayers?.length ?? 0) > 0 && (
        <>
          <h4 className="mt-3 text-xs font-medium uppercase text-zinc-400">Missing players</h4>
          <ul>
            {team?.missingPlayers?.map((m, i) => (
              <li key={m.player?.id ?? i} className="flex items-center gap-2 py-1 text-sm odd:bg-zinc-50">
                <span className="truncate">{m.player?.name}</span>
                <Badge tone={"missing" === m.type ? "red" : "amber"}>{m.type}</Badge>
                <span className="text-xs text-zinc-500">
                  {m.description ?? `reason ${m.reason}`}
                  {m.expectedEndDate && ` · until ${m.expectedEndDate.slice(0, 10)}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function Lineups({ event, lineups }: { event: Event; lineups: LineupsResponse }) {
  const sides = sidesFor(event);
  return (
    <div>
      <div className="mb-3">
        <Badge tone={lineups.confirmed ? "green" : "zinc"}>
          confirmed: {String(lineups.confirmed ?? "–")}
        </Badge>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {sides.map((side) => (
          <TeamColumn key={side} event={event} side={side} team={lineups[side]} />
        ))}
      </div>
    </div>
  );
}
