"use client";

import { sportSlug } from "@/lib/format";
import { isInverse, sidesFor, teamOf } from "@/lib/sides";
import type { Event, GraphResponse, Incident } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import RawJson from "./RawJson";
import { ResultMeta, ResultState } from "./Section";

const W = 1000;
// Room for the first and last tick labels.
const PAD = 16;
const AXIS_Y = 110;
const GRAPH_H = 70;
const LANE = 26;

function markerColor(incident: Incident): string {
  switch (incident.incidentType) {
    case "goal":
      return "#16a34a";
    case "card":
      return "yellow" === incident.incidentClass ? "#facc15" : "#dc2626";
    case "substitution":
      return "#2563eb";
    case "varDecision":
      return "#9333ea";
    default:
      return "#71717a";
  }
}

function markerLabel(incident: Incident): string {
  const who = incident.player?.name ?? incident.playerIn?.name ?? incident.playerName ?? incident.text ?? "";
  const added = undefined !== incident.addedTime && incident.addedTime > 0 && 999 !== incident.addedTime;
  const time = added ? `${incident.time}+${incident.addedTime}'` : `${incident.time}'`;
  return `${time} ${incident.incidentType}${incident.incidentClass ? `/${incident.incidentClass}` : ""} ${who}`.trim();
}

/** Regulation length in minutes; extended by the latest incident or graph point. */
function axisLength(event: Event, incidents: Incident[], graph: GraphResponse | null): number {
  let regulation = 90;
  if ("basketball" === sportSlug(event)) {
    regulation = (event.defaultPeriodCount ?? 4) * (event.defaultPeriodLength ?? 10);
  } else if (undefined !== event.defaultPeriodCount && undefined !== event.defaultPeriodLength) {
    regulation = event.defaultPeriodCount * event.defaultPeriodLength;
  }
  let last = regulation;
  for (const incident of incidents) {
    if (typeof incident.time === "number") {
      last = Math.max(last, incident.time);
    }
  }
  for (const point of graph?.graphPoints ?? []) {
    if (typeof point.minute === "number") {
      last = Math.max(last, point.minute);
    }
  }
  return Math.ceil(last);
}

function ticks(length: number, sport: string | undefined, periodLength: number | undefined): number[] {
  let step = 15;
  if ("basketball" === sport) {
    step = periodLength ?? 10;
  }
  const result: number[] = [];
  for (let t = 0; t <= length; t += step) {
    result.push(t);
  }
  return result;
}

export default function Timeline({ event, incidents }: { event: Event; incidents: Incident[] }) {
  const graphResult = useApi<GraphResponse>(undefined === event.id ? null : `/event/${event.id}/graph`);
  const graph = "ok" === graphResult.status ? graphResult.data : null;
  const inverse = isInverse(event);
  const [left, right] = sidesFor(event);
  const sport = sportSlug(event);

  const timed = incidents.filter((i) => typeof i.time === "number" && i.time >= 0);
  const length = axisLength(event, timed, graph);
  const x = (minute: number) => PAD + (Math.min(minute, length) / length) * (W - 2 * PAD);

  const points = (graph?.graphPoints ?? []).filter(
    (p): p is { minute: number; value: number } =>
      typeof p.minute === "number" && typeof p.value === "number",
  );
  const maxAbs = Math.max(1, ...points.map((p) => Math.abs(p.value)));
  // Positive = home; flip when the away team is drawn first (top = left team).
  const sign = inverse ? -1 : 1;
  const graphMid = AXIS_Y - LANE - GRAPH_H / 2 - 6;
  const y = (v: number) => graphMid - ((sign * v) / maxAbs) * (GRAPH_H / 2);

  let area = "";
  if (points.length > 0) {
    area = `M ${x(points[0].minute)} ${graphMid} `;
    area += points.map((p) => `L ${x(p.minute)} ${y(p.value)}`).join(" ");
    area += ` L ${x(points[points.length - 1].minute)} ${graphMid} Z`;
  }

  const height = AXIS_Y + LANE + 30;
  const periodMarks = timed.filter((i) => "period" === i.incidentType);
  const markers = timed.filter((i) => "period" !== i.incidentType && "injuryTime" !== i.incidentType);

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-semibold text-blue-700">▲ {teamOf(event, left)?.name}</span>
        <span className="font-semibold text-orange-600">▼ {teamOf(event, right)?.name}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="Event timeline">
        {points.length > 0 && (
          <g>
            <clipPath id="above">
              <rect x="0" y="0" width={W} height={graphMid} />
            </clipPath>
            <clipPath id="below">
              <rect x="0" y={graphMid} width={W} height={height} />
            </clipPath>
            <path d={area} fill="#2563eb" opacity="0.55" clipPath="url(#above)" />
            <path d={area} fill="#f97316" opacity="0.55" clipPath="url(#below)" />
            <line x1="0" x2={W} y1={graphMid} y2={graphMid} stroke="#d4d4d8" />
          </g>
        )}

        <line x1="0" x2={W} y1={AXIS_Y} y2={AXIS_Y} stroke="#52525b" strokeWidth="1.5" />
        {ticks(length, sport, event.defaultPeriodLength).map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={AXIS_Y - 3} y2={AXIS_Y + 3} stroke="#52525b" />
            <text x={x(t)} y={height - 4} fontSize="11" textAnchor="middle" fill="#71717a">
              {t}&apos;
            </text>
          </g>
        ))}

        {periodMarks.map((p, i) => (
          <g key={`p${i}`}>
            <line
              x1={x(p.time ?? 0)}
              x2={x(p.time ?? 0)}
              y1={8}
              y2={AXIS_Y + LANE}
              stroke="#a1a1aa"
              strokeDasharray="3 3"
            />
            <text x={x(p.time ?? 0) - 3} y={14} fontSize="10" textAnchor="end" fill="#71717a">
              {p.text}
            </text>
          </g>
        ))}

        {markers.map((m, i) => {
          const top = true === m.isHome ? !inverse : inverse;
          const cy = top ? AXIS_Y - LANE / 2 : AXIS_Y + LANE / 2;
          const cx = x(m.time ?? 0);
          return (
            <g key={m.id ?? i}>
              <title>{markerLabel(m)}</title>
              {"card" === m.incidentType ? (
                <rect
                  x={cx - 4}
                  y={cy - 6}
                  width="8"
                  height="12"
                  rx="1.5"
                  fill={markerColor(m)}
                  stroke="#00000033"
                />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={"goal" === m.incidentType ? 6 : 4}
                  fill={markerColor(m)}
                  stroke="#fff"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-green-600" /> goal
        </span>
        <span>
          <span className="inline-block h-2.5 w-2 rounded-sm bg-yellow-400" /> /{" "}
          <span className="inline-block h-2.5 w-2 rounded-sm bg-red-600" /> card
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-blue-600" /> substitution
        </span>
        <span>
          <span className="inline-block h-2 w-2 rounded-full bg-purple-600" /> VAR
        </span>
        <span>hover a marker for details</span>
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-sm font-semibold">Momentum / score graph</h3>
          <ResultMeta result={graphResult} />
        </div>
        {"ok" === graphResult.status ? (
          <>
            <p className="text-xs text-zinc-500">
              {points.length} points · periodTime {graph?.periodTime ?? "–"} · periodCount{" "}
              {graph?.periodCount ?? "–"} · overtimeLength {graph?.overtimeLength ?? "–"}
            </p>
            <RawJson data={graphResult.data} />
          </>
        ) : (
          <ResultState result={graphResult} />
        )}
      </div>
    </div>
  );
}
