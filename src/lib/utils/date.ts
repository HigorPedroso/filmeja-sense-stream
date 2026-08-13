// Local calendar date as YYYY-MM-DD, matching Postgres `date` columns.
// Deliberately NOT `new Date().toISOString().split("T")[0]` — that reads the
// UTC date, which rolls over hours before local midnight for timezones behind
// UTC (e.g. Brazil, UTC-3 flips to "tomorrow" at 21:00 local time), resetting
// daily counters early.
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
