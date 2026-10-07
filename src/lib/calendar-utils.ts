export interface SessionDay {
  iso: string;
  weekday: string;
  dayNum: number;
  month: string;
}

export const SESSION_SLOTS = [
  "9:00 AM",
  "10:30 AM",
  "12:00 PM",
  "2:00 PM",
  "3:30 PM",
  "5:00 PM",
];

function bogotaToday(): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(new Date()).split("-").map(Number);
  return { y, m, d };
}

/**
 * Next available days (starting tomorrow, Bogotá timezone, Sundays skipped).
 * Dates are anchored to UTC midnight so labels never drift across timezones.
 */
export function getUpcomingDays(count = 21): SessionDay[] {
  const { y, m, d } = bogotaToday();
  const out: SessionDay[] = [];
  let cursor = new Date(Date.UTC(y, m - 1, d + 1));
  while (out.length < count) {
    if (cursor.getUTCDay() !== 0) {
      out.push({
        iso: cursor.toISOString().slice(0, 10),
        weekday: new Intl.DateTimeFormat("es-CO", {
          weekday: "short",
          timeZone: "UTC",
        })
          .format(cursor)
          .replace(/\./g, ""),
        dayNum: cursor.getUTCDate(),
        month: new Intl.DateTimeFormat("es-CO", {
          month: "short",
          timeZone: "UTC",
        })
          .format(cursor)
          .replace(/\./g, ""),
      });
    }
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return out;
}

export function formatSessionDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}
