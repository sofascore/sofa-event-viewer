"use client";

import { useState, type ReactNode } from "react";
import { readRaw, writeRaw } from "@/lib/storage";
import { CARD } from "./Section";

export interface CardTab {
  key: string;
  label: string;
  /** Rendered only while active, so a tab's requests start when it is opened. */
  render: () => ReactNode;
}

/** Card with underline tabs; the last chosen tab is remembered under `storageKey`. */
export default function TabCard({ tabs, storageKey }: { tabs: CardTab[]; storageKey: string }) {
  const [active, setActive] = useState<string>(() => {
    if (typeof window === "undefined") {
      return tabs[0].key;
    }
    const stored = readRaw(storageKey);
    if (null !== stored && tabs.some((t) => t.key === stored)) {
      return stored;
    }
    return tabs[0].key;
  });
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  const choose = (key: string) => {
    setActive(key);
    writeRaw(storageKey, key);
  };

  return (
    <div className={`${CARD} !p-0`}>
      <div role="tablist" className="flex overflow-x-auto border-b border-zinc-200 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === current.key}
            onClick={() => choose(tab.key)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${
              tab.key === current.key
                ? "border-sofa text-sofa"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">{current.render()}</div>
    </div>
  );
}
