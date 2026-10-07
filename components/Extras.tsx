"use client";

import { useState, type ReactNode } from "react";
import { formatValue, sportSlug } from "@/lib/format";
import type { Event, EventsResponse, Named, Player } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import EntityImage from "./EntityImage";
import EventList from "./EventList";
import RawJson from "./RawJson";
import { Badge, ResultMeta, ResultState } from "./Section";

type Json = Record<string, unknown>;

interface Extra {
  title: string;
  path: string;
  render?: (data: Json) => ReactNode;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function PregameForm({ data, event }: { data: Json; event: Event }) {
  const rows: [string, Json | undefined][] = [
    [event.homeTeam?.name ?? "home", data.homeTeam as Json | undefined],
    [event.awayTeam?.name ?? "away", data.awayTeam as Json | undefined],
  ];
  return (
    <table className="text-sm">
      <tbody>
        {rows.map(([team, form]) => (
          <tr key={team}>
            <td className="py-0.5 pr-4">{team}</td>
            <td className="pr-4 text-zinc-500">pos {formatValue(form?.position)}</td>
            <td className="pr-4 num">{formatValue(form?.value)}</td>
            <td className="flex gap-0.5 py-0.5">
              {asArray<string>(form?.form).map((r, i) => (
                <Badge key={i} tone={"W" === r ? "green" : "L" === r ? "red" : "zinc"}>
                  {r}
                </Badge>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Streaks({ data }: { data: Json }) {
  const groups = Object.entries(data).filter(([, v]) => Array.isArray(v));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map(([key, items]) => (
        <div key={key}>
          <h4 className="mb-1 font-mono text-xs text-zinc-500">{key}</h4>
          <table className="w-full text-sm">
            <tbody>
              {asArray<Json>(items).map((s, i) => (
                <tr key={i} className="odd:bg-zinc-50">
                  <td className="py-0.5 pr-2 text-xs text-zinc-500">{formatValue(s.team)}</td>
                  <td className="py-0.5 pr-2">{formatValue(s.name)}</td>
                  <td className="py-0.5 text-right num">{formatValue(s.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function Managers({ data }: { data: Json }) {
  return (
    <div className="flex flex-wrap gap-6 text-sm">
      {(["homeManager", "awayManager"] as const).map((key) => {
        const manager = data[key] as Named | undefined;
        return (
          <div key={key} className="flex items-center gap-2">
            <EntityImage kind="manager" id={manager?.id} name={manager?.name} size={28} />
            <span className="text-xs text-zinc-500">{key}</span>
            <span>{manager?.name ?? "–"}</span>
            <span className="font-mono text-xs text-zinc-400">{manager?.id}</span>
          </div>
        );
      })}
    </div>
  );
}

interface BestPlayer {
  label?: string;
  value?: string;
  player?: Player;
}

function BestPlayers({ data }: { data: Json }) {
  const rows: { key: string; entry: BestPlayer }[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      value.forEach((entry: BestPlayer, i) => rows.push({ key: `${key}[${i}]`, entry }));
    } else if (typeof value === "object" && null !== value && "player" in value) {
      rows.push({ key, entry: value as BestPlayer });
    }
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(({ key, entry }) => (
          <tr key={key} className="odd:bg-zinc-50">
            <td className="py-0.5 pr-3 font-mono text-xs text-zinc-500">{key}</td>
            <td className="py-0.5 pr-3">{entry.player?.name ?? "–"}</td>
            <td className="py-0.5 pr-3 text-xs text-zinc-500">{entry.label}</td>
            <td className="py-0.5 text-right num">{entry.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Shotmap({ data }: { data: Json }) {
  const shots = asArray<Json>(data.shotmap);
  return (
    <div className="max-h-96 overflow-auto">
      <p className="mb-1 text-xs text-zinc-500">{shots.length} shots</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500">
            <th className="pr-2 font-medium">Min</th>
            <th className="pr-2 font-medium">Side</th>
            <th className="pr-2 font-medium">Player</th>
            <th className="pr-2 font-medium">Type</th>
            <th className="pr-2 font-medium">Situation</th>
            <th className="pr-2 font-medium">Body part</th>
            <th className="pr-2 text-right font-medium">xG</th>
            <th className="text-right font-medium">x, y</th>
          </tr>
        </thead>
        <tbody>
          {shots.map((s, i) => {
            const coords = s.playerCoordinates as { x?: number; y?: number } | undefined;
            return (
              <tr key={i} className="odd:bg-zinc-50">
                <td className="pr-2 num">{formatValue(s.time)}</td>
                <td className="pr-2">{true === s.isHome ? "home" : "away"}</td>
                <td className="pr-2">{(s.player as Player | undefined)?.name}</td>
                <td className="pr-2">{formatValue(s.shotType)}</td>
                <td className="pr-2">{formatValue(s.situation)}</td>
                <td className="pr-2">{formatValue(s.bodyPart)}</td>
                <td className="pr-2 text-right num">{formatValue(s.xg)}</td>
                <td className="text-right num">{coords ? `${coords.x}, ${coords.y}` : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExtraCard({ extra, open, onToggle }: { extra: Extra; open: boolean; onToggle: () => void }) {
  const result = useApi<Json>(open ? extra.path : null);
  return (
    <div className="rounded border border-zinc-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
      >
        <span className="w-3 text-zinc-400">{open ? "▾" : "▸"}</span>
        <span className="font-medium">{extra.title}</span>
        <span className="truncate font-mono text-xs text-zinc-400">{extra.path}</span>
        {"ok" === result.status && <Badge tone="green">{result.httpStatus}</Badge>}
        {"error" === result.status && (
          <Badge tone={404 === result.httpStatus ? "zinc" : "red"}>{result.httpStatus ?? "error"}</Badge>
        )}
      </button>
      {open && (
        <div className="border-t border-zinc-100 px-3 py-2">
          <ResultMeta result={result} />
          <div className="mt-2">
            {"ok" === result.status ? (
              <>
                {extra.render?.(result.data)}
                <RawJson data={result.data} />
              </>
            ) : (
              <ResultState result={result} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamEvents({ data, teamId }: { data: Json; teamId: number }) {
  return <EventList events={(data as EventsResponse).events ?? []} highlightTeamId={teamId} />;
}

function extrasFor(event: Event): Extra[] {
  const id = event.id;
  const sport = sportSlug(event);
  const home = event.homeTeam;
  const away = event.awayTeam;
  const extras: Extra[] = [
    {
      title: "Pregame form",
      path: `/event/${id}/pregame-form`,
      render: (d) => <PregameForm data={d} event={event} />,
    },
    { title: "Team streaks", path: `/event/${id}/team-streaks`, render: (d) => <Streaks data={d} /> },
    { title: "Managers", path: `/event/${id}/managers`, render: (d) => <Managers data={d} /> },
  ];

  if ("basketball" !== sport) {
    extras.push({
      title: "Best players (summary)",
      path: `/event/${id}/best-players/summary`,
      render: (d) => <BestPlayers data={d} />,
    });
  }
  if ("football" !== sport) {
    extras.push({
      title: "Best players",
      path: `/event/${id}/best-players`,
      render: (d) => <BestPlayers data={d} />,
    });
  }

  if ("basketball" === sport) {
    for (const team of [home, away]) {
      extras.push({
        title: `Shotmap ${team?.name}`,
        path: `/event/${id}/shotmap/${team?.id}`,
        render: (d) => <Shotmap data={d} />,
      });
    }
  } else {
    extras.push({ title: "Shotmap", path: `/event/${id}/shotmap`, render: (d) => <Shotmap data={d} /> });
  }

  if ("football" !== sport) {
    extras.push({ title: "Series", path: `/event/${id}/series` });
  }

  for (const team of [home, away]) {
    if (undefined === team?.id) {
      continue;
    }
    extras.push({
      title: `${team.name} last events`,
      path: `/team/${team.id}/events/last/0`,
      render: (d) => <TeamEvents data={d} teamId={team.id as number} />,
    });
    extras.push({
      title: `${team.name} next events`,
      path: `/team/${team.id}/events/next/0`,
      render: (d) => <TeamEvents data={d} teamId={team.id as number} />,
    });
  }
  return extras;
}

export default function Extras({ event }: { event: Event }) {
  const extras = extrasFor(event);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (path: string) => {
    const next = new Set(open);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setOpen(next);
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-xs text-zinc-500">Fetched when opened.</p>
        <button
          type="button"
          onClick={() => setOpen(new Set(extras.map((e) => e.path)))}
          className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100"
        >
          Open all
        </button>
        <button
          type="button"
          onClick={() => setOpen(new Set())}
          className="rounded border border-zinc-300 px-2 py-0.5 text-xs hover:bg-zinc-100"
        >
          Close all
        </button>
      </div>
      <div className="space-y-2">
        {extras.map((extra) => (
          <ExtraCard
            key={extra.path}
            extra={extra}
            open={open.has(extra.path)}
            onToggle={() => toggle(extra.path)}
          />
        ))}
      </div>
    </div>
  );
}
