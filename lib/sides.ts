import type { Event, Side } from "./types";

/** Left-to-right team order. Some tournaments show the away team first. */
export function sidesFor(event: Event | undefined): [Side, Side] {
  if (true === event?.tournament?.uniqueTournament?.displayInverseHomeAwayTeams) {
    return ["away", "home"];
  }
  return ["home", "away"];
}

export function isInverse(event: Event | undefined): boolean {
  return "away" === sidesFor(event)[0];
}

export function teamOf(event: Event | undefined, side: Side) {
  return "home" === side ? event?.homeTeam : event?.awayTeam;
}
