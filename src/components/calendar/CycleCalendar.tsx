import { useState } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameMonth, isSameDay, format, isWithinInterval, addDays, differenceInDays, startOfToday, parseISO, parseLocalDate,
} from '../../lib/dateUtils';
import { DayCell } from './DayCell';
import type { CyclePhase } from './DayCell';
import { DayDetailModal } from './DayDetailModal';
import type { Cycle, SymptomLog, Prediction, Appointment } from '../../types';
import type { RecurringPeriod } from '../../hooks/usePredictions';
import type { AppointmentInput } from '../../services/appointmentService';

interface Props {
  cycles: Cycle[];
  symptoms: SymptomLog[];
  prediction: Prediction | null;
  recurringPeriods: RecurringPeriod[];
  appointments: Appointment[];
  onLogSymptoms: (data: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onSaveAppointment: (data: AppointmentInput) => Promise<Appointment>;
  onDeleteAppointment: (id: string) => Promise<void>;
}

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function inRange(date: Date, start: Date, end: Date): boolean {
  if (start > end) return false;
  return isWithinInterval(date, { start, end });
}

export function CycleCalendar({ cycles, symptoms, prediction, recurringPeriods, appointments, onLogSymptoms, onSaveAppointment, onDeleteAppointment }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPad = getDay(monthStart);
  const gridDays: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...days,
  ];

  const periodDays = new Set<string>();
  for (const c of cycles) {
    if (!c.end_date) {
      periodDays.add(c.start_date);
    } else {
      eachDayOfInterval({ start: parseISO(c.start_date), end: parseISO(c.end_date) })
        .forEach(d => periodDays.add(format(d, 'yyyy-MM-dd')));
    }
  }

  const symptomEmojiMap  = new Map(symptoms.map(s => [s.log_date, s.feeling_emoji ?? null]));
  const symptomLogDates  = new Set(symptoms.map(s => s.log_date));
  const appointmentMap   = new Map(appointments.map(a => [a.date, a]));

  const prevMonth = () => setViewDate(d => { const m = new Date(d); m.setMonth(m.getMonth() - 1); return m; });
  const nextMonth = () => setViewDate(d => { const m = new Date(d); m.setMonth(m.getMonth() + 1); return m; });

  const lastCycle = cycles.length > 0 ? cycles[0] : null;

  function getPhaseInfo(date: Date, iso: string): { phase: CyclePhase | null; isLogged: boolean; isOvulationDay: boolean } {
    if (periodDays.has(iso)) {
      return { phase: 'menstrual', isLogged: true, isOvulationDay: false };
    }

    if (prediction && lastCycle) {
      const lastEnd = lastCycle.end_date
        ? parseISO(lastCycle.end_date)
        : addDays(parseISO(lastCycle.start_date), prediction.avgPeriodDuration - 1);

      if (isSameDay(date, prediction.ovulationDay)) {
        return { phase: 'ovulatory', isLogged: false, isOvulationDay: true };
      }
      if (inRange(date, prediction.fertileWindowStart, prediction.fertileWindowEnd)) {
        return { phase: 'ovulatory', isLogged: false, isOvulationDay: false };
      }
      if (inRange(date, addDays(prediction.fertileWindowEnd, 1), addDays(prediction.nextPeriodStart, -1))) {
        return { phase: 'luteal', isLogged: false, isOvulationDay: false };
      }
      if (inRange(date, addDays(lastEnd, 1), addDays(prediction.fertileWindowStart, -1))) {
        return { phase: 'follicular', isLogged: false, isOvulationDay: false };
      }
    }

    for (let i = 0; i < recurringPeriods.length; i++) {
      const rp = recurringPeriods[i];

      if (inRange(date, rp.start, rp.end)) {
        return { phase: 'menstrual', isLogged: false, isOvulationDay: false };
      }

      const nextRp = recurringPeriods[i + 1];
      if (nextRp) {
        if (inRange(date, addDays(rp.end, 1), addDays(nextRp.fertileWindowStart, -1))) {
          return { phase: 'follicular', isLogged: false, isOvulationDay: false };
        }
        if (isSameDay(date, nextRp.ovulationDay)) {
          return { phase: 'ovulatory', isLogged: false, isOvulationDay: true };
        }
        if (inRange(date, nextRp.fertileWindowStart, nextRp.fertileWindowEnd)) {
          return { phase: 'ovulatory', isLogged: false, isOvulationDay: false };
        }
        if (inRange(date, addDays(nextRp.fertileWindowEnd, 1), addDays(nextRp.start, -1))) {
          return { phase: 'luteal', isLogged: false, isOvulationDay: false };
        }
      } else if (prediction) {
        const estimatedNextFertile = addDays(rp.start, prediction.avgCycleLength - 19);
        if (inRange(date, addDays(rp.end, 1), addDays(estimatedNextFertile, -1))) {
          return { phase: 'follicular', isLogged: false, isOvulationDay: false };
        }
      }
    }

    return { phase: null, isLogged: false, isOvulationDay: false };
  }

  const monthNumber = format(viewDate, 'MM');
  const monthName = format(viewDate, 'MMMM');
  const year = format(viewDate, 'yyyy');

  const todayISO = format(new Date(), 'yyyy-MM-dd');
  const latestCycle = cycles.length > 0
    ? [...cycles]
        .filter(c => c.start_date <= todayISO)
        .sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ?? null
    : null;
  const cycleDay = latestCycle
    ? Math.max(1, differenceInDays(startOfToday(), parseLocalDate(latestCycle.start_date)) + 1)
    : prediction
      ? Math.max(1, prediction.avgCycleLength - differenceInDays(prediction.nextPeriodStart, startOfToday()) + 1)
      : null;

  return (
    <div
      className="rounded-2xl overflow-hidden h-full flex flex-col"
      style={{ background: '#6B6255', boxShadow: '0 2px 8px rgba(46,40,32,0.12)', borderLeft: '4px solid var(--color-accent)' }}
    >
      {/* Top section: large month number + nav */}
      <div className="relative px-4 pt-4 pb-1">
        {/* Nav buttons */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-normal tracking-widest uppercase" style={{ color: '#F0EDE6' }}>
              {year}
            </p>
            <p className="text-sm font-normal mt-0.5" style={{ color: 'var(--color-text-light)' }}>
              {monthName}
            </p>
            {cycleDay != null && (
              <p className="text-xs tracking-widest uppercase mt-0.5" style={{ color: 'var(--color-moss-base)' }}>
                Day {cycleDay} of cycle
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: '#F0EDE6' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-light)')}
              onMouseLeave={e => (e.currentTarget.style.color = '#F0EDE6')}
            >
              ‹
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: '#F0EDE6' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-light)')}
              onMouseLeave={e => (e.currentTarget.style.color = '#F0EDE6')}
            >
              ›
            </button>
          </div>
        </div>

        {/* Large month number */}
        <div
          className="text-right leading-none font-semibold select-none"
          style={{
            fontSize: 'clamp(60px, 13vw, 105px)',
            color: 'var(--color-peat-dark)',
            letterSpacing: '-0.04em',
            marginRight: '-4px',
          }}
        >
          {monthNumber}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3" style={{ borderTop: '1px solid var(--color-peat-dark)' }} />

      {/* Day headers */}
      <div className="grid grid-cols-7 px-3 mb-1">
        {DAY_INITIALS.map((d, i) => (
          <div
            key={i}
            className="text-center text-xs font-normal tracking-wider py-1"
            style={{ color: '#F0EDE6' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
        {gridDays.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />;
          const iso = format(date, 'yyyy-MM-dd');
          const inMonth = isSameMonth(date, viewDate);
          const { phase, isLogged, isOvulationDay } = getPhaseInfo(date, iso);

          return (
            <div key={iso} className="flex items-center justify-center">
              <DayCell
                date={date}
                inMonth={inMonth}
                phase={phase}
                isLogged={isLogged}
                isOvulationDay={isOvulationDay}
                feelingEmoji={symptomEmojiMap.get(iso) ?? null}
                hasSymptomLog={symptomLogDates.has(iso)}
                hasAppointment={appointmentMap.has(iso)}
                onClick={() => setSelectedDate(date)}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="mt-auto flex gap-3 flex-wrap px-4 py-3"
        style={{ borderTop: '1px solid var(--color-peat-dark)' }}
      >
        {[
          { label: 'Period', color: '#c89fc1' },
          { label: 'Follicular', color: 'var(--color-phase-follicular)' },
          { label: 'Ovulation', color: 'var(--color-moss-base)' },
          { label: 'Luteal', color: 'var(--color-phase-luteal)' },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: color }} />
            <span className="text-xs" style={{ color: '#F0EDE6' }}>{label}</span>
          </span>
        ))}
        <span className="text-xs" style={{ color: 'var(--color-peat-dark)' }}>Lighter = predicted</span>
      </div>

      {selectedDate && (() => {
        const iso = format(selectedDate, 'yyyy-MM-dd');
        const { phase, isLogged, isOvulationDay } = getPhaseInfo(selectedDate, iso);
        const symptomLog  = symptoms.find(s => s.log_date === iso) ?? null;
        const appointment = appointmentMap.get(iso) ?? null;

        return (
          <DayDetailModal
            date={selectedDate}
            symptomLog={symptomLog}
            appointment={appointment}
            phase={phase}
            isLogged={isLogged}
            isOvulationDay={isOvulationDay}
            onSave={onLogSymptoms}
            onSaveAppointment={onSaveAppointment}
            onDeleteAppointment={() => onDeleteAppointment(appointment!.id)}
            onClose={() => setSelectedDate(null)}
          />
        );
      })()}
    </div>
  );
}
