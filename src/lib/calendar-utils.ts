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

function todayInZone(timeZone: string): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(new Date()).split("-").map(Number);
  return { y, m, d };
}

/**
 * Next available days (starting tomorrow in the market's timezone, Sundays
 * skipped). Dates are anchored to UTC midnight so labels never drift across
 * timezones.
 */
export function getUpcomingDays(count = 21, timeZone = "America/Bogota"): SessionDay[] {
  const { y, m, d } = todayInZone(timeZone);
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

/**
 * Google Calendar "add event" link for the booked session (30 minutes,
 * market timezone). Accepts slot labels like "10:30 AM".
 */
export function googleCalendarUrl(
  iso: string,
  time: string,
  timeZone = "America/Bogota"
): string {
  const [year, month, day] = iso.split("-").map(Number);
  let h = 9;
  let min = 0;
  const m = /^(\d{1,2}):(\d{2})\s*(A\.?M\.?|P\.?M\.?)$/i.exec((time ?? "").trim());
  if (m) {
    h = parseInt(m[1], 10);
    min = parseInt(m[2], 10);
    const ap = m[3].replace(/\./g, "").toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = (hh: number, mm: number) =>
    `${year}${pad(month)}${pad(day)}T${pad(hh)}${pad(mm)}00`;
  let endH = h;
  let endM = min + 30;
  if (endM >= 60) {
    endM -= 60;
    endH += 1;
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Sesión de diagnóstico — Julián Alejandro",
    details:
      "Sesión de diagnóstico de tu negocio por videollamada (aprox. 30 minutos). Recibirás el enlace por WhatsApp.",
    dates: `${stamp(h, min)}/${stamp(endH, endM)}`,
    ctz: timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
