import { Suspense } from "react";
import EventView from "@/components/EventView";

// Query params instead of a dynamic route: a static export can't prerender unknown ids.
export default function EventPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
      <EventView />
    </Suspense>
  );
}
