// Minimal shapes of the API responses. Everything is optional: scraped events often lack fields.

export interface Named {
  id?: number;
  name?: string;
  slug?: string;
  shortName?: string;
}

export type Sport = Named;

export interface Team extends Named {
  nameCode?: string;
  teamColors?: { primary?: string; secondary?: string; text?: string };
}

export interface Player extends Named {
  position?: string;
  jerseyNumber?: string;
}

export type Score = Partial<Record<string, number>>;

export interface Status {
  code?: number;
  description?: string;
  type?: string;
}

export interface UniqueTournament extends Named {
  displayInverseHomeAwayTeams?: boolean;
  hasEventPlayerStatistics?: boolean;
  hasBoxScore?: boolean;
}

export interface Tournament extends Named {
  category?: Named & { sport?: Sport; country?: { alpha2?: string } };
  uniqueTournament?: UniqueTournament;
}

export interface Event {
  id?: number;
  customId?: string;
  slug?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore?: Score;
  awayScore?: Score;
  status?: Status;
  winnerCode?: number | null;
  startTimestamp?: number;
  tournament?: Tournament;
  season?: Named & { year?: string };
  roundInfo?: { round?: number; name?: string; slug?: string; cupRoundType?: number };
  time?: Partial<Record<string, number>>;
  periods?: Record<string, string> | null;
  defaultPeriodCount?: number;
  defaultPeriodLength?: number;
  defaultOvertimeLength?: number;
  hasEventPlayerStatistics?: boolean;
  homeRedCards?: number;
  awayRedCards?: number;
  venue?: { name?: string; city?: { name?: string }; stadium?: { name?: string } };
  referee?: Named;
  changes?: { changes?: string[]; changeTimestamp?: number };
  finalResultOnly?: boolean;
  feedLocked?: boolean;
  [key: string]: unknown;
}

export interface EventResponse {
  event?: Event;
}

export interface Incident {
  id?: number;
  incidentType?: string;
  incidentClass?: string;
  time?: number;
  addedTime?: number;
  timeSeconds?: number;
  isHome?: boolean;
  period?: string;
  text?: string;
  homeScore?: number;
  awayScore?: number;
  player?: Player;
  playerName?: string;
  playerIn?: Player;
  playerOut?: Player;
  assist1?: Player;
  assist2?: Player;
  injury?: boolean;
  length?: number;
  reason?: string;
  description?: string;
  confirmed?: boolean;
  [key: string]: unknown;
}

export interface IncidentsResponse {
  incidents?: Incident[];
}

export interface GraphResponse {
  graphPoints?: { minute?: number; value?: number }[];
  periodTime?: number;
  periodCount?: number;
  overtimeLength?: number;
}

export interface StatisticsItem {
  name?: string;
  key?: string;
  home?: string;
  away?: string;
  homeValue?: number;
  awayValue?: number;
  homeTotal?: number;
  awayTotal?: number;
  compareCode?: number;
  statisticsType?: string;
  valueType?: string;
  renderType?: number;
}

export interface StatisticsResponse {
  statistics?: {
    period?: string;
    groups?: { groupName?: string; statisticsItems?: StatisticsItem[] }[];
  }[];
}

export type PlayerStatistics = Record<string, unknown>;

export interface LineupPlayer {
  player?: Player;
  teamId?: number;
  shirtNumber?: number;
  jerseyNumber?: string;
  position?: string;
  substitute?: boolean;
  captain?: boolean;
  avgRating?: number;
  statistics?: PlayerStatistics;
}

export interface MissingPlayer {
  player?: Player;
  type?: string;
  reason?: number;
  description?: string;
  expectedEndDate?: string;
}

export interface LineupTeam {
  formation?: string | null;
  players?: LineupPlayer[];
  missingPlayers?: MissingPlayer[];
  playerColor?: Record<string, string>;
  goalkeeperColor?: Record<string, string>;
}

export interface LineupsResponse {
  confirmed?: boolean;
  home?: LineupTeam;
  away?: LineupTeam;
}

export interface Duel {
  homeWins?: number;
  awayWins?: number;
  draws?: number;
}

export interface H2HResponse {
  teamDuel?: Duel | null;
  managerDuel?: Duel | null;
}

export interface EventsResponse {
  events?: Event[];
}

export type Side = "home" | "away";
