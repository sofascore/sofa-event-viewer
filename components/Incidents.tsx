"use client";

import { Fragment, useState, type ReactNode } from "react";
import { formatIncidentTime, sportSlug } from "@/lib/format";
import { isInverse } from "@/lib/sides";
import type { Event, Incident, IncidentsResponse, Player } from "@/lib/types";
import { Badge, Toggle } from "./Section";

const TYPE_TONES: Record<string, "zinc" | "blue" | "green" | "amber" | "red"> = {
  goal: "green",
  card: "amber",
  substitution: "blue",
  period: "zinc",
  varDecision: "red",
};

function name(player: Player | undefined): string | undefined {
  return player?.name ?? player?.shortName;
}

function cardColor(incidentClass: string | undefined): string {
  if ("yellow" === incidentClass) {
    return "bg-yellow-400";
  }
  if ("yellowRed" === incidentClass) {
    return "bg-gradient-to-br from-yellow-400 to-red-600";
  }
  return "bg-red-600";
}

function describe(incident: Incident): ReactNode {
  const type = incident.incidentType;
  if ("goal" === type) {
    const assists = [name(incident.assist1), name(incident.assist2)].filter(Boolean);
    return (
      <>
        <span className="font-medium">{name(incident.player) ?? incident.playerName ?? "?"}</span>
        {assists.length > 0 && <span className="text-zinc-500"> (assist {assists.join(", ")})</span>}
      </>
    );
  }
  if ("card" === type) {
    return (
      <>
        <span
          className={`mr-1 inline-block h-3 w-2 rounded-sm align-middle ${cardColor(incident.incidentClass)}`}
        />
        <span className="font-medium">{name(incident.player) ?? incident.playerName ?? "?"}</span>
        {incident.reason && <span className="text-zinc-500"> · {incident.reason}</span>}
      </>
    );
  }
  if ("substitution" === type) {
    return (
      <>
        <span className="text-green-700">↑ {name(incident.playerIn) ?? "?"}</span>{" "}
        <span className="text-red-700">↓ {name(incident.playerOut) ?? "?"}</span>
        {incident.injury && <span className="text-zinc-500"> · injury</span>}
      </>
    );
  }
  if ("injuryTime" === type) {
    return <span>+{incident.length} min added</span>;
  }
  if ("varDecision" === type) {
    return (
      <>
        <span className="font-medium">{name(incident.player) ?? "?"}</span>
        <span className="text-zinc-500"> · confirmed {String(incident.confirmed ?? "–")}</span>
      </>
    );
  }
  // Unknown types: whatever identifies the incident.
  return <span>{name(incident.player) ?? incident.playerName ?? incident.description ?? ""}</span>;
}

/** "home:away" in display order, or "" when the incident carries no score. */
function scoreText(incident: Incident, inverse: boolean): string {
  const { homeScore, awayScore } = incident;
  if (undefined === homeScore && undefined === awayScore) {
    return "";
  }
  const home = homeScore ?? "–";
  const away = awayScore ?? "–";
  if (inverse) {
    return `${away}:${home}`;
  }
  return `${home}:${away}`;
}

function JsonToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 font-mono text-xs hover:text-zinc-800 ${open ? "text-sofa" : "text-zinc-300"}`}
      title="Show this incident's JSON"
    >
      {"{}"}
    </button>
  );
}

/**
 * Home incidents sit on the left with the time first, away incidents mirror them on the right.
 * Incidents without a side (period, injury time) are centred dividers.
 */
function IncidentRow({ incident, inverse }: { incident: Incident; inverse: boolean }) {
  const [open, setOpen] = useState(false);
  const type = incident.incidentType ?? "unknown";
  const hasSide = typeof incident.isHome === "boolean";
  const onLeft = hasSide && incident.isHome !== inverse;
  const score = scoreText(incident, inverse);
  const time = formatIncidentTime(incident.time, incident.addedTime);
  const toggle = <JsonToggle open={open} onClick={() => setOpen(!open)} />;

  let row;
  if (!hasSide) {
    row = (
      <div className="flex items-center gap-2 py-2">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-semibold text-zinc-700">
          {"period" === type ? (incident.text ?? incident.period ?? "period") : describe(incident)}
          {score && <span className="ml-2 num">{score}</span>}
          <span className="ml-2 font-normal text-zinc-500 num">{time}</span>
          {"period" !== type && <span className="ml-2 font-normal text-zinc-400">{type}</span>}
        </span>
        <div className="h-px flex-1 bg-zinc-200" />
        {toggle}
      </div>
    );
  } else {
    const timeBox = (
      <div className="w-12 shrink-0 text-center">
        <div className="text-sm font-semibold num">{time}</div>
        {score && <div className="text-xs font-semibold text-sofa num">{score}</div>}
      </div>
    );
    const body = (
      <div className={`min-w-0 flex-1 ${onLeft ? "" : "text-right"}`}>
        <div className="text-sm">{describe(incident)}</div>
        <div className={`mt-0.5 flex flex-wrap items-center gap-1 ${onLeft ? "" : "justify-end"}`}>
          <Badge tone={TYPE_TONES[type] ?? "zinc"}>
            {type}
            {incident.incidentClass && `/${incident.incidentClass}`}
          </Badge>
          {incident.text && <span className="text-xs text-zinc-500">“{incident.text}”</span>}
        </div>
      </div>
    );
    row = (
      <div
        className={`flex items-center gap-2 border-b border-zinc-100 py-1.5 ${onLeft ? "" : "flex-row-reverse"}`}
      >
        {timeBox}
        {body}
        {toggle}
      </div>
    );
  }

  return (
    <>
      {row}
      {open && (
        <pre className="mb-1 max-h-80 overflow-auto rounded bg-zinc-50 p-2 text-xs num">
          {JSON.stringify(incident, null, 2)}
        </pre>
      )}
    </>
  );
}

interface Group {
  period: Incident | null;
  items: Incident[];
}

/** The API sends newest first, each `period` incident before its period's incidents. */
function groupByPeriod(incidents: Incident[]): Group[] {
  const groups: Group[] = [];
  let current: Group = { period: null, items: [] };
  for (const incident of incidents) {
    if ("period" === incident.incidentType) {
      if (null !== current.period || current.items.length > 0) {
        groups.push(current);
      }
      current = { period: incident, items: [] };
      continue;
    }
    current.items.push(incident);
  }
  if (null !== current.period || current.items.length > 0) {
    groups.push(current);
  }
  return groups;
}

export default function Incidents({ event, data }: { event: Event; data: IncidentsResponse }) {
  const all = data.incidents ?? [];
  const isBasketball = "basketball" === sportSlug(event);
  const [chronological, setChronological] = useState(false);
  const [grouped, setGrouped] = useState(isBasketball);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const inverse = isInverse(event);

  if (0 === all.length) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const incident of all) {
    const type = incident.incidentType ?? "unknown";
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const toggleType = (type: string) => {
    const next = new Set(hidden);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setHidden(next);
  };

  // Filter after grouping so hiding `period` still keeps the grouping headers.
  const visible = (incident: Incident) => !hidden.has(incident.incidentType ?? "unknown");
  let groups: Group[] = grouped ? groupByPeriod(all) : [{ period: null, items: all.filter(visible) }];
  if (grouped) {
    groups = groups.map((g) => ({ ...g, items: g.items.filter(visible) }));
  }
  if (chronological) {
    groups = [...groups].reverse().map((g) => ({ ...g, items: [...g.items].reverse() }));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Toggle label="Chronological" checked={chronological} onChange={setChronological} />
        <Toggle label="Group by period" checked={grouped} onChange={setGrouped} />
        <span className="text-xs text-zinc-500">{all.length} incidents · API order is newest first</span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        {[...counts.entries()].map(([type, count]) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            className={`rounded-full border px-2 py-0.5 text-xs ${
              hidden.has(type)
                ? "border-zinc-200 bg-white text-zinc-400 line-through"
                : "border-zinc-300 bg-zinc-100 text-zinc-800"
            }`}
          >
            {type} <span className="num">{count}</span>
          </button>
        ))}
      </div>
      <div>
        {groups.map((group, gi) => (
          <Fragment key={gi}>
            {grouped && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-sofa-soft px-3 py-1.5 text-xs font-semibold text-sofa">
                {null === group.period ? (
                  "Before any period incident"
                ) : (
                  <>
                    {group.period.text ?? group.period.period ?? "period"}
                    <span className="num">{scoreText(group.period, inverse)}</span>
                    <span className="ml-auto font-normal text-zinc-500">
                      {group.period.period && <span className="font-mono">{group.period.period} · </span>}
                      {formatIncidentTime(group.period.time, group.period.addedTime)} · {group.items.length}{" "}
                      incidents
                    </span>
                  </>
                )}
              </div>
            )}
            {group.items.map((incident, ii) => (
              <IncidentRow key={incident.id ?? `${gi}-${ii}`} incident={incident} inverse={inverse} />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
