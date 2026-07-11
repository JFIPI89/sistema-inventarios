/** Mexico-focused app: all presentation and calendar-day boundaries use CDMX. */

export const APP_TIMEZONE = "America/Mexico_City" as const;
export const APP_LOCALE = "es-MX" as const;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIMEZONE,
  dateStyle: "short",
  timeStyle: "short",
});

const utcDateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function toDate(date: Date | string | number): Date {
  return date instanceof Date ? date : new Date(date);
}

/** True when the instant is exactly UTC midnight (legacy date-only storage). */
function isUtcMidnight(d: Date): boolean {
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Offset (ms) such that: utc = wallTimeAsUtcMs - offset.
 * Equivalent to (zonedWallClockAsUtc - actualUtc).
 */
function getTimeZoneOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

/** Convert a CDMX wall-clock date+time to a UTC Date. */
export function zonedDateTimeToUtc(
  dateKey: string,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0
): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error(`Fecha inválida: ${dateKey}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  let utc = wallAsUtc - getTimeZoneOffsetMs(new Date(wallAsUtc));
  const offset2 = getTimeZoneOffsetMs(new Date(utc));
  if (offset2 !== getTimeZoneOffsetMs(new Date(wallAsUtc))) {
    utc = wallAsUtc - offset2;
  }
  return new Date(utc);
}

/** YYYY-MM-DD in America/Mexico_City for an instant. */
export function toDateKey(date: Date | string | number = new Date()): string {
  return dateKeyFormatter.format(toDate(date));
}

/**
 * Calendar day for date-only fields.
 * Legacy rows stored as UTC midnight keep their UTC Y-M-D;
 * newer rows (CDMX midnight) use America/Mexico_City.
 */
export function toCalendarDateKey(date: Date | string | number): string {
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "";
  if (isUtcMidnight(d)) {
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }
  return toDateKey(d);
}

/** Start of the given CDMX calendar day as UTC Date. */
export function startOfZonedDay(dateKey: string): Date {
  return zonedDateTimeToUtc(dateKey, 0, 0, 0, 0);
}

/** End of the given CDMX calendar day as UTC Date. */
export function endOfZonedDay(dateKey: string): Date {
  return zonedDateTimeToUtc(dateKey, 23, 59, 59, 999);
}

/** Start of "today" in CDMX. */
export function startOfAppDay(date: Date | string | number = new Date()): Date {
  return startOfZonedDay(toDateKey(date));
}

/** End of that CDMX calendar day. */
export function endOfAppDay(date: Date | string | number = new Date()): Date {
  return endOfZonedDay(toDateKey(date));
}

/** Parse HTML date input (YYYY-MM-DD) as CDMX start-of-day (UTC instant). */
export function parseAppDate(dateKey: string): Date {
  return startOfZonedDay(dateKey);
}

/** Inclusive range for filters from two YYYY-MM-DD keys (CDMX days). */
export function parseAppDateRange(startDate: string, endDate: string): { start: Date; end: Date } {
  return {
    start: startOfZonedDay(startDate),
    end: endOfZonedDay(endDate),
  };
}

/** Add calendar days to a YYYY-MM-DD key (or to an instant's CDMX day). */
export function addAppCalendarDays(dateKeyOrDate: string | Date, days: number): string {
  const key =
    typeof dateKeyOrDate === "string" ? dateKeyOrDate : toDateKey(dateKeyOrDate);
  const [y, m, d] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(y!, m! - 1, d! + days));
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}

/** Default report window ending today (CDMX), going back `days` calendar days. */
export function defaultDateRangeDays(days = 30): { start: string; end: string } {
  const end = toDateKey(new Date());
  return { start: addAppCalendarDays(end, -days), end };
}

/** Whole calendar days from `fromKey` to `toKey` (YYYY-MM-DD). */
export function calendarDaysBetween(fromKey: string, toKey: string): number {
  const from = startOfZonedDay(fromKey).getTime();
  const to = startOfZonedDay(toKey).getTime();
  return Math.round((to - from) / 86_400_000);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "—";
  // Legacy date-only (UTC midnight): show that calendar day, not CDMX previous evening.
  if (isUtcMidnight(d)) return utcDateFormatter.format(d);
  return dateFormatter.format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFormatter.format(d);
}

/** ISO-like local datetime string for CSV/PDF (CDMX). */
export function formatDateTimeIso(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = toDate(date);
  if (Number.isNaN(d.getTime())) return "";
  const key = toDateKey(d);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    dtf
      .formatToParts(d)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  ) as Record<string, string>;
  return `${key}T${parts.hour}:${parts.minute}:${parts.second}`;
}

/** Date key for exports (CDMX for timestamps; UTC Y-M-D for legacy date-only). */
export function formatDateKey(date: Date | string | null | undefined): string {
  if (!date) return "";
  return toCalendarDateKey(date);
}

/** @deprecated Prefer APP_TIMEZONE; kept for docs / optional process.env.TZ */
export function getAppTimezone(): string {
  return APP_TIMEZONE;
}
