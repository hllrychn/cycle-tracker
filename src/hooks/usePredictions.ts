import { useMemo } from 'react';
import type { Cycle, Prediction } from '../types';
import { parseISO, differenceInDays, addDays, subDays, startOfToday } from '../lib/dateUtils';

interface Options {
  customCycleLength?: number | null;
  customPeriodDuration?: number | null;
  delayDays?: number;
}

export function computePrediction(cycles: Cycle[], options: Options = {}): Prediction | null {
  if (cycles.length === 0) return null;

  const { customCycleLength = null, customPeriodDuration = null, delayDays = 0 } = options;

  const todayISO = new Date().toISOString().slice(0, 10);
  const sorted = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date));

  // Split into past cycles (started today or earlier) and future logged cycles
  const pastCycles = sorted.filter(c => c.start_date <= todayISO);
  const futureCycles = sorted.filter(c => c.start_date > todayISO);

  // Need at least one past cycle to compute stats
  const statCycles = pastCycles.length > 0 ? pastCycles : sorted;

  // Cycle lengths between consecutive starts (past cycles only)
  const rawLengths: number[] = [];
  for (let i = 0; i < statCycles.length - 1; i++) {
    const len = differenceInDays(parseISO(statCycles[i + 1].start_date), parseISO(statCycles[i].start_date));
    if (len >= 15 && len <= 49) rawLengths.push(len);
  }

  // Period durations (past cycles only)
  const rawDurations: number[] = [];
  for (const c of statCycles) {
    if (c.end_date) {
      const dur = differenceInDays(parseISO(c.end_date), parseISO(c.start_date)) + 1;
      if (dur >= 1 && dur <= 14) rawDurations.push(dur);
    }
  }

  // Cycle length: custom setting takes priority, then weighted average, then default 28
  let avgCycleLength: number;
  if (customCycleLength != null && customCycleLength >= 15 && customCycleLength <= 49) {
    avgCycleLength = customCycleLength;
  } else if (rawLengths.length === 0) {
    avgCycleLength = 28;
  } else if (rawLengths.length < 3) {
    avgCycleLength = Math.round(rawLengths.reduce((a, b) => a + b, 0) / rawLengths.length);
  } else {
    let weightedSum = 0;
    let totalWeight = 0;
    rawLengths.forEach((len, i) => {
      const w = i + 1;
      weightedSum += len * w;
      totalWeight += w;
    });
    avgCycleLength = Math.round(weightedSum / totalWeight);
  }

  const avgPeriodDuration =
    customPeriodDuration != null && customPeriodDuration >= 1 && customPeriodDuration <= 14
      ? customPeriodDuration
      : rawDurations.length > 0
        ? Math.round(rawDurations.reduce((a, b) => a + b, 0) / rawDurations.length)
        : 5;

  // If there's a future logged cycle, use it as the next period directly
  let nextPeriodStart: Date;
  let nextPeriodEnd: Date;
  const nextLogged = futureCycles[0] ?? null;
  if (nextLogged) {
    nextPeriodStart = parseISO(nextLogged.start_date);
    nextPeriodEnd = nextLogged.end_date
      ? parseISO(nextLogged.end_date)
      : addDays(nextPeriodStart, avgPeriodDuration - 1);
  } else {
    const lastStart = parseISO(statCycles[statCycles.length - 1].start_date);
    const baseNextPeriodStart = addDays(lastStart, avgCycleLength);
    nextPeriodStart = addDays(baseNextPeriodStart, delayDays);
    nextPeriodEnd = addDays(nextPeriodStart, avgPeriodDuration - 1);
  }

  // If ovulation for this cycle has already passed, show next cycle's fertile window
  const today = startOfToday();
  const baseOvulation = subDays(nextPeriodStart, 14);
  const ovulation = baseOvulation < today
    ? subDays(addDays(nextPeriodStart, avgCycleLength), 14)
    : baseOvulation;
  const fertileWindowStart = subDays(ovulation, 5);
  const fertileWindowEnd = addDays(ovulation, 1);

  const sampleSize = customCycleLength != null ? 99 : rawLengths.length; // custom = always high confidence
  const confidence: Prediction['confidence'] =
    sampleSize >= 5 ? 'high' : sampleSize >= 2 ? 'medium' : 'low';

  const cycleVariation = rawLengths.length >= 2
    ? Math.max(...rawLengths) - Math.min(...rawLengths)
    : null;

  return {
    nextPeriodStart,
    nextPeriodEnd,
    ovulationDay: ovulation,
    fertileWindowStart,
    fertileWindowEnd,
    avgCycleLength,
    avgPeriodDuration,
    cycleVariation,
    confidence,
  };
}

export interface RecurringPeriod {
  start: Date;
  end: Date;
  ovulationDay: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
}

export function computeRecurringPeriods(
  prediction: Prediction,
  count: number
): RecurringPeriod[] {
  const periods: RecurringPeriod[] = [];
  for (let i = 0; i < count; i++) {
    const start = addDays(prediction.nextPeriodStart, i * prediction.avgCycleLength);
    const end   = addDays(start, prediction.avgPeriodDuration - 1);
    const ovulationDay      = subDays(start, 14);
    const fertileWindowStart = subDays(ovulationDay, 5);
    const fertileWindowEnd   = addDays(ovulationDay, 1);
    periods.push({ start, end, ovulationDay, fertileWindowStart, fertileWindowEnd });
  }
  return periods;
}

export function usePredictions(
  cycles: Cycle[],
  options: Options = {}
): Prediction | null {
  return useMemo(
    () => computePrediction(cycles, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cycles, options.customCycleLength, options.delayDays]
  );
}
