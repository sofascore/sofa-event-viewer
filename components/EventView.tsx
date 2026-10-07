"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { sportSlug } from "@/lib/format";
import { rememberEvent } from "@/lib/recentEvents";
import type {
  Event,
  EventResponse,
  H2HResponse,
  IncidentsResponse,
  LineupsResponse,
  StatisticsResponse,
} from "@/lib/types";
import { useApi, type ApiResult } from "@/lib/useApi";
import BoxScore from "./BoxScore";
import EventHeader from "./EventHeader";
import Extras from "./Extras";
import H2H from "./H2H";
import Incidents from "./Incidents";
import Lineups from "./Lineups";
import PeriodScores from "./PeriodScores";
import Section, { CARD } from "./Section";
import Statistics from "./Statistics";
import TabCard, { type CardTab } from "./TabCard";
import Timeline from "./Timeline";

/** Box score, lineups, statistics and H2H in one tabbed card; each tab fetches when opened. */
function EventTabs({ event, lineups }: { event: Event; lineups: ApiResult<LineupsResponse> }) {
  const basketball = "basketball" === sportSlug(event);
  const tabs: CardTab[] = [
    {
      key: "boxscore",
      label: basketball ? "Box score" : "Player statistics",
      render: () => (
        <Section
          bare
          title="Box score"
          result={lineups}
          emptyText="No player statistics in the lineups."
          raw={() => "Same response as the Lineups tab."}
        >
          {(data) => <BoxScore event={event} lineups={data} />}
        </Section>
      ),
    },
    {
      key: "lineups",
      label: "Lineups",
      render: () => (
        <Section bare title="Lineups" result={lineups}>
          {(data) => <Lineups event={event} lineups={data} />}
        </Section>
      ),
    },
    { key: "statistics", label: "Statistics", render: () => <StatisticsTab event={event} /> },
    { key: "h2h", label: "H2H", render: () => <H2HTab event={event} /> },
  ];
  return <TabCard tabs={tabs} storageKey="sofa-event-viewer:eventTab" />;
}

function StatisticsTab({ event }: { event: Event }) {
  const statistics = useApi<StatisticsResponse>(`/event/${event.id}/statistics`);
  return (
    <Section bare title="Statistics" result={statistics} emptyText="No statistics.">
      {(data) => ((data.statistics?.length ?? 0) > 0 ? <Statistics event={event} data={data} /> : null)}
    </Section>
  );
}

function H2HTab({ event }: { event: Event }) {
  const h2h = useApi<H2HResponse>(`/event/${event.id}/h2h`);
  return (
    <Section bare title="Head to head" result={h2h}>
      {(data) => <H2H event={event} data={data} />}
    </Section>
  );
}

/** Every section below the header. Mounted only once the event loaded, so a bad id costs one request. */
function EventSections({ event }: { event: Event }) {
  const id = event.id;
  const lineups = useApi<LineupsResponse>(`/event/${id}/lineups`);
  const incidents = useApi<IncidentsResponse>(`/event/${id}/incidents`);

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4">
          <Section
            id="periods"
            title="Period scores"
            result={{ status: "ok", url: "", data: event, httpStatus: 200, ms: 0 }}
            raw={() => ({
              homeScore: event.homeScore,
              awayScore: event.awayScore,
              periods: event.periods,
              time: event.time,
            })}
          >
            {() => <PeriodScores event={event} />}
          </Section>

          <Section id="incidents" title="Incidents" result={incidents} emptyText="No incidents.">
            {(data) => ((data.incidents?.length ?? 0) > 0 ? <Incidents event={event} data={data} /> : null)}
          </Section>
        </div>

        <div className="min-w-0 lg:col-span-2">
          <EventTabs event={event} lineups={lineups} />
        </div>
      </div>

      <Section
        id="timeline"
        title="Timeline"
        result={incidents}
        raw={() => "Same response as Incidents above."}
      >
        {(data) => <Timeline event={event} incidents={data.incidents ?? []} />}
      </Section>

      <section id="extras" className={CARD}>
        <h2 className="mb-2 text-base font-bold">Extras</h2>
        <Extras event={event} />
      </section>
    </>
  );
}

export default function EventView() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const id = null !== rawId && /^\d+$/.test(rawId) ? rawId : null;
  const eventResult = useApi<EventResponse>(null === id ? null : `/event/${id}`);
  const event = "ok" === eventResult.status ? eventResult.data.event : undefined;

  useEffect(() => {
    if (undefined === event?.id) {
      return;
    }
    const label = `${event.homeTeam?.name ?? "?"} – ${event.awayTeam?.name ?? "?"} (${event.tournament?.name ?? ""})`;
    rememberEvent({ id: event.id, label, sport: sportSlug(event) });
  }, [event]);

  if (null === id) {
    return (
      <p className="text-sm text-zinc-600">
        Missing or invalid <code className="font-mono">?id=</code>.{" "}
        <Link href="/" className="text-blue-700 underline">
          Open an event
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Section id="header" title="Match" result={eventResult}>
        {(data) => (data.event ? <EventHeader event={data.event} /> : null)}
      </Section>

      {undefined !== event?.id && <EventSections key={event.id} event={event} />}
    </div>
  );
}
