"use client";

import { useEffect } from "react";
import { formatValue } from "@/lib/format";
import type { LineupPlayer } from "@/lib/types";
import { useApi } from "@/lib/useApi";
import EntityImage from "./EntityImage";
import RawJson from "./RawJson";
import { ResultMeta, ResultState } from "./Section";

/** Side panel with a player's lineup statistics and their `/event/{id}/player/{pid}/statistics`. */
export default function PlayerDrawer({
  eventId,
  lineupPlayer,
  onClose,
}: {
  eventId: number;
  lineupPlayer: LineupPlayer;
  onClose: () => void;
}) {
  const player = lineupPlayer.player;
  const result = useApi<{ statistics?: Record<string, unknown> }>(
    undefined === player?.id ? null : `/event/${eventId}/player/${player.id}/statistics`,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ("Escape" === e.key) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const detailed = "ok" === result.status ? (result.data.statistics ?? {}) : {};

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/20" onClick={onClose}>
      <aside
        className="h-full w-full max-w-xl overflow-y-auto bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-label="Player statistics"
      >
        <div className="mb-3 flex items-center gap-3">
          <EntityImage kind="player" id={player?.id} name={player?.name} size={40} />
          <div className="min-w-0">
            <div className="truncate font-semibold">{player?.name}</div>
            <div className="text-xs text-zinc-500">
              id <span className="font-mono">{player?.id}</span> · #
              {lineupPlayer.jerseyNumber ?? lineupPlayer.shirtNumber} ·{" "}
              {lineupPlayer.position ?? player?.position ?? "no position"}
              {lineupPlayer.substitute ? " · bench" : " · starter"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded border border-zinc-300 px-2 py-0.5 text-sm hover:bg-zinc-100"
          >
            Close
          </button>
        </div>

        <h3 className="mb-1 text-sm font-semibold">Player statistics endpoint</h3>
        <ResultMeta result={result} />
        <div className="mt-2">
          <ResultState result={result} />
        </div>
        {"ok" === result.status && (
          <>
            <table className="mt-2 w-full table-fixed text-sm">
              <tbody>
                {Object.entries(detailed)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <tr key={key} className="odd:bg-zinc-50">
                      <td className="w-1/2 py-0.5 pr-3 font-mono text-xs text-zinc-600">{key}</td>
                      <td className="break-all py-0.5 text-right num">{formatValue(value)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <RawJson data={result.data} />
          </>
        )}

        <h3 className="mb-1 mt-5 text-sm font-semibold">Lineup entry</h3>
        <RawJson data={lineupPlayer} label="Lineup player JSON" />
      </aside>
    </div>
  );
}
