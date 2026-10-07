"use client";

import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

/** `tick` is bumped by the refresh button and by polling; every useApi refetches when it changes. */
export const RefreshContext = createContext<{ tick: number; refresh: () => void }>({
  tick: 0,
  refresh: () => {},
});

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const value = useMemo(() => ({ tick, refresh }), [tick, refresh]);
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}
