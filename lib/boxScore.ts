import { formatSeconds, formatValue } from "./format";
import type { LineupPlayer, PlayerStatistics } from "./types";

export interface StatColumn {
  id: string;
  label: string;
  /** Statistics keys the column reads; a key used by a column doesn't get its own column. */
  keys: string[];
  render: (stats: PlayerStatistics) => string;
  /** Numeric value used for sorting. */
  sortValue: (stats: PlayerStatistics) => number | null;
  /** Whether summing the column across players makes sense. */
  summable: boolean;
}

function num(stats: PlayerStatistics, key: string): number | null {
  const value = stats[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function single(key: string, label = key, summable = true): StatColumn {
  return {
    id: key,
    label,
    keys: [key],
    render: (stats) => formatValue(stats[key]),
    sortValue: (stats) => num(stats, key),
    summable,
  };
}

function seconds(key: string, label: string): StatColumn {
  return {
    ...single(key, label),
    render: (stats) => formatSeconds(stats[key]),
  };
}

/** "made/attempts (pct%)", e.g. field goals. */
function ratio(id: string, label: string, made: string, attempts: string, percent = true): StatColumn {
  return {
    id,
    label,
    keys: [made, attempts],
    render: (stats) => {
      const m = num(stats, made);
      const a = num(stats, attempts);
      if (null === m && null === a) {
        return "";
      }
      const base = `${m ?? "–"}/${a ?? "–"}`;
      if (!percent || null === m || null === a || 0 === a) {
        return base;
      }
      return `${base} ${Math.round((m / a) * 100)}%`;
    },
    sortValue: (stats) => num(stats, made),
    summable: true,
  };
}

/** "won (total)" for duel-like stats where the API sends won and lost. */
function wonOfTotal(id: string, label: string, won: string, lost: string): StatColumn {
  return {
    id,
    label,
    keys: [won, lost],
    render: (stats) => {
      const w = num(stats, won);
      const l = num(stats, lost);
      if (null === w && null === l) {
        return "";
      }
      return `${w ?? 0} (${(w ?? 0) + (l ?? 0)})`;
    },
    sortValue: (stats) => num(stats, won),
    summable: true,
  };
}

const NOT_SUMMABLE = new Set(["rating", "avgRating", "topSpeed", "pir", "ratingVersions"]);

// Order of the real basketball box score (EventPlayerStatistics/groups/basketball.ts).
const BASKETBALL: StatColumn[] = [
  seconds("secondsPlayed", "MIN"),
  single("points", "PTS"),
  single("rebounds", "REB"),
  single("assists", "AST"),
  single("steals", "STL"),
  single("blocks", "BLK"),
  single("personalFouls", "PF"),
  single("turnovers", "TOV"),
  single("offensiveRebounds", "OREB"),
  single("defensiveRebounds", "DREB"),
  ratio("fg", "FG", "fieldGoalsMade", "fieldGoalAttempts"),
  ratio("ft", "FT", "freeThrowsMade", "freeThrowAttempts"),
  ratio("3p", "3P", "threePointsMade", "threePointAttempts"),
  ratio("2p", "2P", "twoPointsMade", "twoPointAttempts"),
  single("plusMinus", "+/-"),
  single("pir", "PIR", false),
  single("rating", "Rating", false),
];

// Order of the real football player table (EventPlayerStatistics/groups/football.ts).
const FOOTBALL: StatColumn[] = [
  single("minutesPlayed", "Min"),
  single("rating", "Rating", false),
  single("goals", "G"),
  single("goalAssist", "A"),
  single("totalTackle", "Tackles"),
  ratio("passes", "Acc. passes", "accuratePass", "totalPass"),
  wonOfTotal("duels", "Duels won", "duelWon", "duelLost"),
  wonOfTotal("aerials", "Aerials won", "aerialWon", "aerialLost"),
  single("onTargetScoringAttempt", "On target"),
  single("expectedGoals", "xG"),
  single("shotOffTarget", "Off target"),
  single("blockedScoringAttempt", "Blocked"),
  ratio("dribbles", "Dribbles", "wonContest", "totalContest", false),
  single("totalClearance", "Clearances"),
  single("outfielderBlock", "Blocks"),
  single("interceptionWon", "Interceptions"),
  single("challengeLost", "Dribbled past"),
  single("touches", "Touches"),
  single("keyPass", "Key passes"),
  ratio("crosses", "Crosses", "accurateCross", "totalCross", false),
  ratio("longBalls", "Long balls", "accurateLongBalls", "totalLongBalls", false),
  single("possessionLostCtrl", "Poss. lost"),
  single("fouls", "Fouls"),
  single("wasFouled", "Was fouled"),
  single("saves", "Saves"),
  single("goalsPrevented", "Goals prevented"),
];

const IGNORED_KEYS = new Set(["statisticsType"]);

/**
 * Known columns first (in the real site's order) for keys present on at least one player,
 * then every remaining key alphabetically, so nothing the API sends is hidden.
 */
export function boxScoreColumns(sport: string | undefined, players: LineupPlayer[]): StatColumn[] {
  const present = new Set<string>();
  for (const player of players) {
    for (const key of Object.keys(player.statistics ?? {})) {
      if (!IGNORED_KEYS.has(key)) {
        present.add(key);
      }
    }
  }

  let known: StatColumn[] = [];
  if ("basketball" === sport) {
    known = BASKETBALL;
  } else if ("football" === sport) {
    known = FOOTBALL;
  }

  const columns: StatColumn[] = [];
  const used = new Set<string>();
  for (const column of known) {
    if (column.keys.some((k) => present.has(k))) {
      columns.push(column);
      column.keys.forEach((k) => used.add(k));
    }
  }
  const rest = [...present].filter((k) => !used.has(k)).sort((a, b) => a.localeCompare(b));
  for (const key of rest) {
    columns.push(single(key, key, !NOT_SUMMABLE.has(key)));
  }
  return columns;
}

/** Per-key sums over the given players; non-numeric values are ignored. */
export function sumStatistics(players: LineupPlayer[]): PlayerStatistics {
  const totals: Record<string, number> = {};
  for (const player of players) {
    for (const [key, value] of Object.entries(player.statistics ?? {})) {
      if (typeof value === "number" && Number.isFinite(value)) {
        totals[key] = (totals[key] ?? 0) + value;
      }
    }
  }
  for (const key of Object.keys(totals)) {
    totals[key] = Math.round(totals[key] * 1000) / 1000;
  }
  return totals;
}
