import { TIMEDELTA_SERVICE_ENDPOINT } from "./constants";

const ANCHOR_TIMESTAMP_MS = Date.parse("2000-01-01T00:00:00.000Z");

export function minutesToTimestamp(minutes: number): string {
  return new Date(ANCHOR_TIMESTAMP_MS + minutes * 60000).toISOString();
}

export async function requestScheduledEndTime(
  startMinutes: number,
  durationMinutes: number
): Promise<string> {
  const timestamp = minutesToTimestamp(startMinutes);
  const url =
    `${TIMEDELTA_SERVICE_ENDPOINT}/timedelta?timestamp=${encodeURIComponent(timestamp)}` +
    `&operation=add&value=${durationMinutes}&unit=minutes`;

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || typeof data.ResultingTimestamp !== "string") {
    throw new Error("Timedelta request failed.");
  }
  return data.ResultingTimestamp;
}
