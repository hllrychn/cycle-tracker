import { useState } from 'react';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type SupType = 'mineral' | 'vitamin' | 'omega' | 'herb' | 'probiotic';
type Filter = 'all' | SupType;

interface Supplement {
  emoji: string;
  name: string;
  dose: string;
  reason: string;
  type: SupType;
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

const SUPPLEMENTS: Record<Phase, { headline: string; sub: string; items: Supplement[] }> = {
  menstrual: {
    headline: 'Replenish & restore',
    sub: 'Support your body through blood loss and inflammation',
    items: [
      { emoji: '🩸', name: 'Iron',       dose: '18 mg daily with vitamin C', reason: 'Replenishes iron lost during menstrual bleeding and combats fatigue', type: 'mineral' },
      { emoji: '⚡', name: 'Magnesium',  dose: '300–400 mg before bed',       reason: 'Relaxes uterine muscles, eases cramps, and improves sleep quality',   type: 'mineral' },
      { emoji: '🐟', name: 'Omega-3',    dose: '1–2 g daily with food',       reason: 'Reduces prostaglandins that drive cramping and inflammation',           type: 'omega'   },
      { emoji: '☀️', name: 'Vitamin D',  dose: '1,000–2,000 IU daily',        reason: 'Supports mood and immune function, often depleted during menstruation', type: 'vitamin' },
      { emoji: '🔋', name: 'Vitamin B12', dose: '500–1,000 mcg daily',        reason: 'Helps sustain energy levels and red blood cell production',             type: 'vitamin' },
    ],
  },
  follicular: {
    headline: 'Build & energise',
    sub: 'Fuel rising oestrogen and follicle development',
    items: [
      { emoji: '🌿', name: 'B-Complex',   dose: '1 capsule daily with food',    reason: 'Supports oestrogen metabolism and sustained energy production',    type: 'vitamin'   },
      { emoji: '🦠', name: 'Probiotics',  dose: '10–20 billion CFU daily',      reason: 'Promotes healthy oestrobolome for balanced oestrogen clearance',   type: 'probiotic' },
      { emoji: '🔬', name: 'Zinc',        dose: '8–15 mg daily',                reason: 'Essential for follicle maturation and immune resilience',           type: 'mineral'   },
      { emoji: '🍊', name: 'Vitamin C',   dose: '500–1,000 mg daily',           reason: 'Enhances iron absorption and provides antioxidant protection',      type: 'vitamin'   },
      { emoji: '⚙️', name: 'CoQ10',       dose: '100–200 mg daily with fat',    reason: 'Powers mitochondria in developing follicles and boosts energy',     type: 'vitamin'   },
    ],
  },
  ovulatory: {
    headline: 'Peak support',
    sub: 'Protect the egg and sustain peak hormone output',
    items: [
      { emoji: '🥚', name: 'Folate',       dose: '400–800 mcg daily',             reason: 'Critical for cell division and DNA integrity around ovulation',   type: 'vitamin' },
      { emoji: '🫐', name: 'Vitamin E',    dose: '200–400 IU daily with food',    reason: 'Antioxidant shield for the maturing egg and follicle environment', type: 'vitamin' },
      { emoji: '🔬', name: 'Selenium',     dose: '55–200 mcg daily',              reason: 'Supports follicle rupture and protects egg from oxidative stress', type: 'mineral' },
      { emoji: '⚙️', name: 'CoQ10',        dose: '200–600 mg daily with fat',     reason: 'Maximises mitochondrial energy in the egg during peak fertility',  type: 'vitamin' },
      { emoji: '🐟', name: 'Omega-3',      dose: '1–2 g daily with food',         reason: 'Anti-inflammatory support during the ovulation inflammatory response', type: 'omega' },
    ],
  },
  luteal: {
    headline: 'Balance & calm',
    sub: 'Ease PMS and support progesterone',
    items: [
      { emoji: '⚡', name: 'Magnesium',          dose: '300–400 mg daily, evening',   reason: 'Reduces bloating, mood swings, headaches, and insomnia in the luteal phase', type: 'mineral' },
      { emoji: '🌿', name: 'Vitamin B6',          dose: '25–100 mg daily with food',   reason: 'Supports progesterone production and alleviates PMS symptoms',               type: 'vitamin' },
      { emoji: '🦋', name: 'Evening Primrose Oil', dose: '500–1,500 mg daily',         reason: 'GLA fatty acids reduce breast tenderness and PMS-related inflammation',       type: 'omega'   },
      { emoji: '🪨', name: 'Calcium',              dose: '600–1,200 mg daily',         reason: 'Clinical studies show calcium reduces PMS mood and physical symptoms',        type: 'mineral' },
      { emoji: '🌱', name: 'Vitex (Chasteberry)',  dose: '20–40 mg standardised daily', reason: 'Supports LH surge balance and progesterone levels in the second half of cycle', type: 'herb'  },
    ],
  },
  unknown: {
    headline: 'Your supplements',
    sub: 'Log a period to get phase-specific recommendations',
    items: [],
  },
};

const TYPE_LABELS: Record<SupType, string> = {
  mineral:   'Mineral',
  vitamin:   'Vitamin',
  omega:     'Omega / Oil',
  herb:      'Herb',
  probiotic: 'Probiotic',
};

const TYPE_STYLE: Record<SupType, { bg: string; color: string }> = {
  mineral:   { bg: 'var(--color-peat-mid)',      color: 'var(--color-peat-dark)'  },
  vitamin:   { bg: 'var(--color-blue-light)',    color: 'var(--color-blue-dark)'  },
  omega:     { bg: 'var(--color-phase-follicular)', color: 'var(--color-blue-dark)' },
  herb:      { bg: 'var(--color-moss-light)',    color: 'var(--color-moss-dark)'  },
  probiotic: { bg: 'var(--color-accent-light)',  color: 'var(--color-accent-dark)' },
};

const PHASE_STYLE: Record<Phase, { border: string; headerBg: string }> = {
  menstrual:  { border: 'var(--color-peat-deep)',  headerBg: 'var(--color-phase-menstrual)'  },
  follicular: { border: 'var(--color-blue-mid)',   headerBg: 'var(--color-phase-follicular)' },
  ovulatory:  { border: 'var(--color-moss-base)',  headerBg: 'var(--color-phase-ovulation)'  },
  luteal:     { border: 'var(--color-peat-deep)',  headerBg: 'var(--color-phase-luteal)'     },
  unknown:    { border: 'var(--color-peat-mid)',   headerBg: 'var(--color-peat-light)'       },
};

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all',      label: 'All'       },
  { value: 'mineral',  label: 'Minerals'  },
  { value: 'vitamin',  label: 'Vitamins'  },
  { value: 'omega',    label: 'Omegas'    },
  { value: 'herb',     label: 'Herbs'     },
  { value: 'probiotic', label: 'Probiotics' },
];

const DISCLAIMER = 'Always consult a healthcare professional before starting or changing supplements.';

export function SupplementCard({ cycles, prediction }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const cycleDay = getCurrentCycleDay(cycles, prediction);
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;
  const phase = cycleDay != null
    ? getPhase(cycleDay, avgCycleLength, avgPeriodDuration)
    : 'unknown';

  const { headline, sub, items } = SUPPLEMENTS[phase];
  const style = PHASE_STYLE[phase];

  const filtered = filter === 'all' ? items : items.filter(s => s.type === filter);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: `4px solid ${style.border}` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ background: style.headerBg }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-peat-deep)' }}>
              Supplements
            </p>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{headline}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>{sub}</p>
          </div>
          <div className="text-2xl shrink-0">💊</div>
        </div>
      </div>

      {phase === 'unknown' ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
            Log your first period to unlock phase-specific supplement recommendations.
          </p>
        </div>
      ) : (
        <>
          {/* Type filter */}
          <div className="px-5 pt-4 pb-3">
            <div className="flex gap-1.5 flex-wrap">
              {FILTER_OPTIONS.filter(f => f.value === 'all' || items.some(s => s.type === f.value)).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                  style={filter === value
                    ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                    : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Supplement rows */}
          <div className="divide-y" style={{ borderTop: '1px solid var(--color-peat-light)', borderColor: 'var(--color-peat-light)' }}>
            {filtered.map((s) => {
              const ts = TYPE_STYLE[s.type];
              return (
                <div key={s.name} className="px-5 py-4 flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: ts.bg }}
                  >
                    {s.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{s.name}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: ts.bg, color: ts.color }}
                      >
                        {TYPE_LABELS[s.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>Dose</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{ background: 'var(--color-peat-light)', color: 'var(--color-text-primary)' }}
                      >
                        {s.dose}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-peat-deep)', fontWeight: 300 }}>
                      {s.reason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div className="px-5 py-3" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
            <p className="text-xs italic" style={{ color: 'var(--color-peat-mid)' }}>{DISCLAIMER}</p>
          </div>
        </>
      )}
    </div>
  );
}
