"use client";

import { useState } from "react";
import { isInverse, sidesFor, teamOf } from "@/lib/sides";
import type { Event, StatisticsItem, StatisticsResponse } from "@/lib/types";
import { Tabs } from "./Section";

function Bar({ item, inverse }: { item: StatisticsItem; inverse: boolean }) {
  const home = Math.max(0, item.homeValue ?? 0);
  const away = Math.max(0, item.awayValue ?? 0);
  const total = home + away;
  let homePct = 50;
  if (total > 0) {
    homePct = (home / total) * 100;
  }
  const leftPct = inverse ? 100 - homePct : homePct;
  // compareCode: 1 home better, 2 away better, 3 equal.
  const homeBetter = 1 === item.compareCode;
  const awayBetter = 2 === item.compareCode;
  const leftBetter = inverse ? awayBetter : homeBetter;
  const rightBetter = inverse ? homeBetter : awayBetter;

  return (
    <div className="flex h-2 w-full overflow-hidden rounded bg-zinc-100">
      <div className={leftBetter ? "bg-blue-600" : "bg-blue-300"} style={{ width: `${leftPct}%` }} />
      <div
        className={rightBetter ? "bg-orange-500" : "bg-orange-300"}
        style={{ width: `${100 - leftPct}%` }}
      />
    </div>
  );
}

export default function Statistics({ event, data }: { event: Event; data: StatisticsResponse }) {
  const periods = data.statistics ?? [];
  const [active, setActive] = useState<string>(periods[0]?.period ?? "ALL");
  const inverse = isInverse(event);
  const [left, right] = sidesFor(event);

  if (0 === periods.length) {
    return null;
  }

  const current = periods.find((p) => p.period === active) ?? periods[0];

  return (
    <div>
      <Tabs
        tabs={periods.map((p, i) => ({ key: p.period ?? String(i), label: p.period ?? `#${i}` }))}
        active={current.period ?? "0"}
        onChange={setActive}
      />
      <div className="mb-2 flex justify-between text-xs font-semibold">
        <span className="text-blue-700">{teamOf(event, left)?.name}</span>
        <span className="text-orange-600">{teamOf(event, right)?.name}</span>
      </div>
      <div className="grid gap-x-8 gap-y-4 lg:grid-cols-2">
        {(current.groups ?? []).map((group, gi) => (
          <div key={`${group.groupName}-${gi}`}>
            <h3 className="mb-1 border-b border-zinc-200 pb-1 text-sm font-semibold">{group.groupName}</h3>
            <table className="w-full text-sm">
              <tbody>
                {(group.statisticsItems ?? []).map((item, ii) => {
                  const leftValue = inverse ? item.away : item.home;
                  const rightValue = inverse ? item.home : item.away;
                  return (
                    <tr key={`${item.key ?? item.name}-${ii}`} className="odd:bg-zinc-50">
                      <td className="w-16 py-1 pr-2 text-left font-medium num">{leftValue}</td>
                      <td className="py-1">
                        <div className="text-center text-xs text-zinc-600" title={item.key}>
                          {item.name}
                          {item.key && (
                            <span className="ml-1 font-mono text-[10px] text-zinc-400">{item.key}</span>
                          )}
                        </div>
                        <Bar item={item} inverse={inverse} />
                      </td>
                      <td className="w-16 py-1 pl-2 text-right font-medium num">{rightValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
