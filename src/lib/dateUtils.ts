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

export function fromISODate(dateStr: string): Date {
  return parseISO(dateStr);
}
