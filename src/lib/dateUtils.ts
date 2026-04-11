import {
  parseISO,
  format,
  differenceInDays,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfToday,
} from 'date-fns';

export {
  parseISO,
  format,
  differenceInDays,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfToday,
};

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Returns today's date as YYYY-MM-DD in local time. Use this instead of
 *  new Date().toISOString().slice(0,10), which returns UTC and can be
 *  "tomorrow" for users in timezones behind UTC after a certain hour. */
export function todayLocalISO(): string {
  return format(startOfToday(), 'yyyy-MM-dd');
}

/** Parses a YYYY-MM-DD date string as local midnight.
 *  parseISO() treats date-only strings as UTC midnight, which is "yesterday
 *  evening" for UTC- timezone users and breaks all local-date arithmetic.
 *  Always use this instead of parseISO() for stored cycle date strings. */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d); // local midnight
}

export function fromISODate(dateStr: string): Date {
  return parseISO(dateStr);
}
