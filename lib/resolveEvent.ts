import { readApiBase } from "./apiBase";
import { parseEventInput } from "./format";
import { fetchApi } from "./useApi";

/** Event id, sofascore.com match URL or customId → numeric event id, or a message saying why not. */
export async function resolveEventId(input: string): Promise<{ id: string } | { error: string }> {
  const parsed = parseEventInput(input);
  if (null === parsed) {
    return { error: "Enter an event id, a sofascore.com match URL or a customId." };
  }
  if ("id" in parsed) {
    return parsed;
  }

  // The match URL's path segment is the customId; the real site resolves it the same way.
  const path = `/event/${encodeURIComponent(parsed.customId)}/currently-relevant`;
  const result = await fetchApi<{ currentlyRelevantEvent?: { id?: number } }>(readApiBase(), path);
  if ("error" === result.status) {
    return { error: `Could not resolve customId "${parsed.customId}": ${result.error} (${result.url})` };
  }
  const id = result.data.currentlyRelevantEvent?.id;
  if (undefined === id) {
    return { error: `No currently relevant event for customId "${parsed.customId}".` };
  }
  return { id: String(id) };
}
