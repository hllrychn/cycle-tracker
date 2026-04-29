import { isToday } from '../../lib/dateUtils';
import type { BiodynamicDayType } from '../../lib/lunarUtils';
import { DAY_TYPE_COLOR } from '../../lib/lunarUtils';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

interface Props {
  date: Date;
  inMonth: boolean;
  phase: CyclePhase | null;
  isLogged: boolean;
  isOvulationDay: boolean;
  feelingEmoji: string | null;
  hasSymptomLog?: boolean;
  hasAppointment?: boolean;
  moonEmoji?: string;
  dayType?: BiodynamicDayType;
  onClick: () => void;
}

const PHASE_BG: Record<CyclePhase, string> = {
  menstrual:  '#c89fc1',
  follicular: 'var(--color-phase-follicular)',
  ovulatory:  'var(--color-phase-ovulation)',
  luteal:     'var(--color-phase-luteal)',
};

const PHASE_TEXT: Record<CyclePhase, string> = {
  menstrual:  'var(--color-peat-dark)',
  follicular: 'var(--color-blue-dark)',
  ovulatory:  'var(--color-moss-dark)',
  luteal:     'var(--color-peat-dark)',
};

export function DayCell({ date, inMonth, phase, isLogged, isOvulationDay, feelingEmoji, hasSymptomLog, hasAppointment, moonEmoji, dayType, onClick }: Props) {
  const today = isToday(date);
  const day = date.getDate();

  let bgColor = '';
  let textColor = 'var(--color-text-light)';
  let opacity = inMonth ? 1 : 0.2;

  if (isOvulationDay) {
    bgColor = 'var(--color-moss-base)';
    textColor = 'var(--color-bg-dark)';
  } else if (phase) {
    bgColor = PHASE_BG[phase];
    textColor = PHASE_TEXT[phase];
    if (!isLogged) opacity = inMonth ? 0.5 : 0.15;
  }

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center h-8 w-8 rounded-full text-xs cursor-pointer select-none transition-opacity"
      style={{
        background: bgColor || 'transparent',
        color: hasAppointment ? '#4A7FD4' : (bgColor ? textColor : 'var(--color-text-light)'),
        fontWeight: hasAppointment ? 700 : 400,
        opacity,
        outline: today ? '2px solid var(--color-moss-base)' : undefined,
        outlineOffset: today ? '2px' : undefined,
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = String(Math.min(1, opacity + 0.2)); }}
      onMouseLeave={e => { e.currentTarget.style.opacity = String(opacity); }}
    >
      {/* Day type dot — top-left */}
      {dayType && (
        <span
          className="absolute rounded-full"
          style={{ width: 4, height: 4, top: 2, left: 2, background: DAY_TYPE_COLOR[dayType], opacity: inMonth ? 0.85 : 0.3 }}
        />
      )}
      {/* Moon phase emoji — centered, large, transparent so date shows through */}
      {moonEmoji && (
        <span
          className="absolute leading-none select-none pointer-events-none"
          style={{
            fontSize: 28,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: inMonth ? 0.28 : 0.1,
            zIndex: 0,
          }}
        >
          {moonEmoji}
        </span>
      )}
      <span className="relative" style={{ zIndex: 1 }}>{day}</span>
      {/* Indicator dots — symptom log and appointment */}
      {(hasSymptomLog || hasAppointment) && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
          {hasSymptomLog && !feelingEmoji && (
            <span className="w-1 h-1 rounded-full" style={{ background: 'var(--color-accent)' }} />
          )}
          {hasAppointment && (
            <span className="w-1 h-1 rounded-full" style={{ background: '#4A7FD4' }} />
          )}
        </span>
      )}
      {feelingEmoji && (
        <span className="absolute -bottom-1 -right-1 text-xs leading-none">{feelingEmoji}</span>
      )}
    </div>
  );
}
