import { useState } from 'react';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type Intensity = 'light' | 'moderate' | 'intense';
type Filter = 'all' | Intensity;

interface ExerciseItem {
  emoji: string;
  name: string;
  reason: string;
  intensity: Intensity;
}

function getPhase(cycleDay: number, avgCycleLength: number, avgPeriodDuration: number): Phase {
  if (cycleDay <= avgPeriodDuration)   return 'menstrual';
  if (cycleDay <= avgCycleLength - 16) return 'follicular';
  if (cycleDay <= avgCycleLength - 11) return 'ovulatory';
  if (cycleDay <= avgCycleLength)      return 'luteal';
  return 'unknown';
}

function getCurrentCycleDay(cycles: Cycle[], prediction: Prediction | null): number | null {
  const todayISO = todayLocalISO();
  const pastCycles = cycles.filter(c => c.start_date <= todayISO);
  if (pastCycles.length > 0) {
    const latest = [...pastCycles].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const day = differenceInDays(startOfToday(), parseLocalDate(latest.start_date)) + 1;
    return day >= 1 ? day : null;
  }
  if (prediction) {
    const daysUntil = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (daysUntil >= 0) return Math.max(1, prediction.avgCycleLength - daysUntil);
  }
  return null;
}

const DO: Record<Phase, { headline: string; items: ExerciseItem[] }> = {
  menstrual: {
    headline: 'Rest & restore',
    items: [
      { emoji: '🧘', name: 'Restorative yoga',   reason: 'Eases cramps and calms the nervous system',        intensity: 'light'    },
      { emoji: '🚶', name: 'Gentle walking',      reason: 'Maintains circulation without overexertion',       intensity: 'light'    },
      { emoji: '🫁', name: 'Breathwork',          reason: 'Reduces cortisol and eases pelvic tension',        intensity: 'light'    },
      { emoji: '🏊', name: 'Swimming',            reason: 'Relieves cramps; weightless, low-impact movement', intensity: 'moderate' },
      { emoji: '🚴', name: 'Easy cycling',        reason: 'Gentle cardio that keeps you moving',             intensity: 'moderate' },
      { emoji: '🛁', name: 'Foam rolling',        reason: 'Myofascial release for lower back and hips',       intensity: 'light'    },
    ],
  },
  follicular: {
    headline: 'Build & explore',
    items: [
      { emoji: '🚶', name: 'Brisk walking',       reason: 'Build aerobic base as energy naturally rises',     intensity: 'light'    },
      { emoji: '🧘', name: 'Yoga flow',            reason: 'Mobility work while flexibility is at its peak',  intensity: 'light'    },
      { emoji: '🏃', name: 'Running',              reason: 'Estrogen supports endurance and faster recovery',  intensity: 'moderate' },
      { emoji: '🥾', name: 'Hiking',               reason: 'Varied terrain sustains growing motivation',       intensity: 'moderate' },
      { emoji: '💃', name: 'Dance classes',        reason: 'Coordination and cardio combined — fun and fresh', intensity: 'moderate' },
      { emoji: '🏋️', name: 'Strength training',   reason: 'Peak window for muscle growth and power gains',    intensity: 'intense'  },
      { emoji: '🥊', name: 'Boxing / HIIT',        reason: 'High intensity matches rising drive and focus',    intensity: 'intense'  },
      { emoji: '🚵', name: 'Spin classes',         reason: 'Cardiovascular challenge you can actually enjoy',  intensity: 'intense'  },
    ],
  },
  ovulatory: {
    headline: 'Peak performance',
    items: [
      { emoji: '🧘', name: 'Active yoga',          reason: 'Recovery between peak sessions',                  intensity: 'light'    },
      { emoji: '🏃', name: 'Running',              reason: 'Set personal bests — body is primed for it',      intensity: 'moderate' },
      { emoji: '🏊', name: 'Swimming',             reason: 'Full-body effort at peak aerobic capacity',        intensity: 'moderate' },
      { emoji: '🏋️', name: 'Heavy lifting',        reason: 'Muscle recruitment is at its highest now',        intensity: 'intense'  },
      { emoji: '⚡', name: 'HIIT',                 reason: 'Max-output sessions — body can handle the demand', intensity: 'intense'  },
      { emoji: '🧗', name: 'Rock climbing',        reason: 'Full-body challenge; socialising boosts the mood', intensity: 'intense'  },
      { emoji: '🏀', name: 'Team sports',          reason: 'Competitive edge and communication are heightened',intensity: 'intense'  },
    ],
  },
  luteal: {
    headline: 'Sustain & steady',
    items: [
      { emoji: '🧘', name: 'Yin yoga',             reason: 'Deep stretching soothes the nervous system',       intensity: 'light'    },
      { emoji: '🚶', name: 'Walking',              reason: 'Steady movement without overstimulation',          intensity: 'light'    },
      { emoji: '🛁', name: 'Foam rolling',         reason: 'Releases tension that builds in the luteal phase', intensity: 'light'    },
      { emoji: '🏃', name: 'Jogging',              reason: 'Moderate pace sustains fitness without burnout',   intensity: 'moderate' },
      { emoji: '🏊', name: 'Swimming',             reason: 'Non-impact cardio that stabilises mood',           intensity: 'moderate' },
      { emoji: '🧘', name: 'Pilates',              reason: 'Core strength through controlled, calm movement',  intensity: 'moderate' },
      { emoji: '🚴', name: 'Cycling',              reason: 'Good outlet for pre-period restless energy',       intensity: 'moderate' },
      { emoji: '💪', name: 'Lighter lifting',      reason: 'Maintain strength gains without overreaching',     intensity: 'intense'  },
    ],
  },
  unknown: {
    headline: 'Everyday movement',
    items: [
      { emoji: '🚶', name: 'Walking',              reason: 'The most underrated consistent habit',             intensity: 'light'    },
      { emoji: '🧘', name: 'Yoga',                 reason: 'Flexibility, breath, and stress regulation',       intensity: 'light'    },
      { emoji: '🏃', name: 'Running',              reason: 'Builds cardiovascular health across all phases',   intensity: 'moderate' },
      { emoji: '🏊', name: 'Swimming',             reason: 'Full-body, low-impact across the whole cycle',     intensity: 'moderate' },
      { emoji: '🏋️', name: 'Strength training',   reason: 'Maintains muscle and bone density year-round',     intensity: 'intense'  },
      { emoji: '💃', name: 'Dance / group classes',reason: 'Social movement supports mental wellbeing',        intensity: 'moderate' },
    ],
  },
};

const LIMIT: Record<Phase, ExerciseItem[]> = {
  menstrual: [
    { emoji: '⚡', name: 'HIIT',               reason: 'Spikes cortisol when your body needs to rest',       intensity: 'intense'  },
    { emoji: '🏋️', name: 'Heavy lifting',      reason: 'Intra-abdominal pressure can worsen cramps',        intensity: 'intense'  },
    { emoji: '🏃', name: 'Long runs',           reason: 'Sustained effort drains already-low iron stores',   intensity: 'moderate' },
    { emoji: '🚵', name: 'High-intensity spin', reason: 'Hormonal stress compounds physical fatigue',        intensity: 'intense'  },
  ],
  follicular: [
    { emoji: '🛁', name: 'Passive rest only',   reason: 'Rising energy rewards movement — use it',           intensity: 'light'    },
    { emoji: '🍸', name: 'Post-exercise alcohol',reason: 'Disrupts the muscle repair estrogen helps enable', intensity: 'moderate' },
  ],
  ovulatory: [
    { emoji: '🏋️', name: 'Skipping strength',   reason: 'Peak estrogen makes this the best time to lift',   intensity: 'moderate' },
    { emoji: '🧘', name: 'Only rest days',       reason: 'Body is primed — save full rest for luteal phase',  intensity: 'light'    },
    { emoji: '⚡', name: 'Ignoring recovery',    reason: 'Even at peak, post-workout recovery still matters', intensity: 'intense'  },
  ],
  luteal: [
    { emoji: '⚡', name: 'New personal bests',   reason: 'Progesterone reduces power output and recovery',    intensity: 'intense'  },
    { emoji: '🥊', name: 'High-intensity HIIT',  reason: 'Risk of injury rises as coordination dips',        intensity: 'intense'  },
    { emoji: '🏃', name: 'Excessive cardio',     reason: 'Adds cortisol load during an already stressed phase',intensity: 'moderate'},
    { emoji: '🏋️', name: 'Max weight lifts',    reason: 'Strength is lower in luteal — adjust expectations', intensity: 'intense'  },
  ],
  unknown: [
    { emoji: '🥵', name: 'Overtraining',         reason: 'Rest is as important as movement across every phase',intensity: 'intense' },
    { emoji: '⚡', name: 'Skipping warm-ups',    reason: 'Injury risk rises without phase-appropriate prep',  intensity: 'moderate' },
  ],
};

const PHASE_STYLE: Record<Phase, { fill: string; accent: string; label: string; text: string }> = {
  menstrual:  { fill: 'var(--color-phase-menstrual)',  accent: 'var(--color-peat-deep)', label: 'Menstrual',  text: 'var(--color-text-primary)' },
  follicular: { fill: 'var(--color-phase-follicular)', accent: 'var(--color-blue-base)', label: 'Follicular', text: 'var(--color-blue-dark)'    },
  ovulatory:  { fill: 'var(--color-phase-ovulation)',  accent: 'var(--color-moss-base)', label: 'Ovulatory',  text: 'var(--color-moss-dark)'    },
  luteal:     { fill: 'var(--color-phase-luteal)',     accent: 'var(--color-peat-deep)', label: 'Luteal',     text: 'var(--color-peat-deep)'    },
  unknown:    { fill: '#FFFFFF',                       accent: 'var(--color-moss-base)', label: '',           text: 'var(--color-peat-deep)'    },
};

const INTENSITY_STYLE: Record<Intensity, { bg: string; color: string; label: string }> = {
  light:    { bg: 'var(--color-moss-light)',   color: 'var(--color-moss-dark)',   label: 'Light'    },
  moderate: { bg: 'var(--color-blue-light)',   color: 'var(--color-blue-dark)',   label: 'Moderate' },
  intense:  { bg: 'var(--color-accent-light)', color: 'var(--color-accent-dark)', label: 'Intense'  },
};

const FILTERS: Filter[] = ['all', 'light', 'moderate', 'intense'];
const FILTER_LABELS: Record<Filter, string> = { all: 'All', light: 'Light', moderate: 'Moderate', intense: 'Intense' };

const PHASES: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

export function ExerciseCard({ cycles, prediction }: Props) {
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;

  const cycleDay   = getCurrentCycleDay(cycles, prediction);
  const todayPhase: Phase = cycleDay != null
    ? getPhase(cycleDay, avgCycleLength, avgPeriodDuration)
    : 'unknown';
  const canNavigate = todayPhase !== 'unknown';

  const [viewPhase, setViewPhase] = useState<Phase | null>(null);
  const [filter, setFilter]       = useState<Filter>('all');

  const activePhase = viewPhase ?? todayPhase;
  const isToday     = viewPhase === null || viewPhase === todayPhase;

  const goToPhase = (direction: 1 | -1) => {
    const base = activePhase === 'unknown' ? 'menstrual' : activePhase;
    const idx  = PHASES.indexOf(base);
    const next = PHASES[(idx + direction + PHASES.length) % PHASES.length];
    setViewPhase(next === todayPhase ? null : next);
  };

  const style = PHASE_STYLE[activePhase];
  const { headline, items } = DO[activePhase];

  const visibleDo    = filter === 'all' ? items         : items.filter(i => i.intensity === filter);
  const visibleLimit = filter === 'all' ? LIMIT[activePhase] : LIMIT[activePhase].filter(i => i.intensity === filter);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: `4px solid ${style.accent}` }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Move well</p>
            {activePhase !== 'unknown' && (
              <p className="text-xs mt-0.5" style={{ color: style.text }}>{headline}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canNavigate && !isToday && (
              <button
                onClick={() => setViewPhase(null)}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ color: 'var(--color-blue-base)', border: '1px solid var(--color-blue-mid)' }}
              >
                ↩ Today
              </button>
            )}
            {activePhase !== 'unknown' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: style.fill, color: style.text }}>
                {style.label}
              </span>
            )}
            {canNavigate && (
              <div className="flex items-center gap-0.5">
                <button onClick={() => goToPhase(-1)} className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: 'var(--color-text-primary)' }}>‹</button>
                <button onClick={() => goToPhase(1)}  className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: 'var(--color-text-primary)' }}>›</button>
              </div>
            )}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)' }}>🏃</div>
          </div>
        </div>

        {/* Intensity filter toggle */}
        <div className="flex rounded-xl p-1 gap-0.5" style={{ background: 'var(--color-peat-light)' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 py-1 text-xs rounded-lg transition-colors font-medium"
              style={filter === f
                ? f === 'all'
                  ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                  : { background: INTENSITY_STYLE[f as Intensity].bg, color: INTENSITY_STYLE[f as Intensity].color }
                : { color: 'var(--color-peat-deep)' }
              }
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Do / Limit — stacked on mobile, side-by-side on sm+ */}
      <div className="sm:flex" style={{ borderTop: '1px solid var(--color-peat-light)' }}>

        {/* Do section */}
        <div className="sm:flex-1 sm:min-w-0" style={{ borderRight: 'none' }}>
          <div className="px-4 py-1.5" style={{ borderBottom: '1px solid var(--color-peat-light)', background: 'var(--color-moss-light)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-moss-dark)' }}>✓ Do</span>
          </div>
          {visibleDo.length === 0 ? (
            <div className="px-4 py-4">
              <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>No {filter} exercises recommended for this phase.</p>
            </div>
          ) : visibleDo.map(({ emoji, name, reason, intensity }, i) => (
            <div key={name} className="px-4 py-3" style={{ background: '#FFFFFF', borderBottom: i < visibleDo.length - 1 ? '1px solid var(--color-peat-light)' : undefined }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base leading-none">{emoji}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{name}</span>
                <span
                  className="ml-auto text-xs px-1.5 py-px rounded-full shrink-0"
                  style={{ background: INTENSITY_STYLE[intensity].bg, color: INTENSITY_STYLE[intensity].color }}
                >
                  {INTENSITY_STYLE[intensity].label}
                </span>
              </div>
              <p className="text-xs leading-relaxed pl-7" style={{ color: 'var(--color-peat-deep)' }}>{reason}</p>
            </div>
          ))}
        </div>

        {/* Limit section */}
        <div
          className="sm:flex-1 sm:min-w-0 sm:border-l"
          style={{ borderTop: '1px solid var(--color-peat-light)', borderColor: 'var(--color-peat-light)' }}
        >
          <div
            className="sm:hidden px-4 py-1.5"
            style={{ borderBottom: '1px solid var(--color-peat-light)', background: 'var(--color-accent-light)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--color-accent-dark)' }}>✕ Limit</span>
          </div>
          <div
            className="hidden sm:block px-4 py-1.5"
            style={{ borderBottom: '1px solid var(--color-peat-light)', borderLeft: '1px solid var(--color-peat-light)', background: 'var(--color-accent-light)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--color-accent-dark)' }}>✕ Limit</span>
          </div>
          {visibleLimit.length === 0 ? (
            <div className="px-4 py-4" style={{ borderLeft: undefined }}>
              <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Nothing specific to limit at this intensity.</p>
            </div>
          ) : visibleLimit.map(({ emoji, name, reason, intensity }, i) => (
            <div
              key={name}
              className="px-4 py-3"
              style={{
                background: '#FFFFFF',
                borderBottom: i < visibleLimit.length - 1 ? '1px solid var(--color-peat-light)' : undefined,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base leading-none">{emoji}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{name}</span>
                <span
                  className="ml-auto text-xs px-1.5 py-px rounded-full shrink-0"
                  style={{ background: INTENSITY_STYLE[intensity].bg, color: INTENSITY_STYLE[intensity].color }}
                >
                  {INTENSITY_STYLE[intensity].label}
                </span>
              </div>
              <p className="text-xs leading-relaxed pl-7" style={{ color: 'var(--color-peat-deep)' }}>{reason}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div className="px-5 py-2.5" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
          {activePhase === 'unknown'
            ? 'Log a period to see exercises tailored to your current cycle phase.'
            : 'General guidance — listen to your body and consult a professional for medical advice.'}
        </p>
      </div>
    </div>
  );
}
