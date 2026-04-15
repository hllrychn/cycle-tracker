import { useState } from 'react';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';
import { useSettings, type AgeGroup } from '../../hooks/useSettings';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type SupType = 'mineral' | 'vitamin' | 'omega' | 'herb' | 'probiotic';
type Filter = 'all' | SupType;

const CYCLE_PHASES: Exclude<Phase, 'unknown'>[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

const PHASE_LABELS: Record<Exclude<Phase, 'unknown'>, string> = {
  menstrual:  'Menstrual',
  follicular: 'Follicular',
  ovulatory:  'Ovulatory',
  luteal:     'Luteal',
};

interface Supplement {
  emoji: string;
  name: string;
  dose: string;
  reason: string;
  type: SupType;
}

interface PhaseData {
  headline: string;
  sub: string;
  items: Supplement[];
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

// ── Supplement data per age group ────────────────────────────────────────────

const BASE_SUPPLEMENTS: Record<Phase, PhaseData> = {
  menstrual: {
    headline: 'Replenish & restore',
    sub: 'Support your body through blood loss and inflammation',
    items: [
      { emoji: '🩸', name: 'Iron',        dose: '18 mg daily with vitamin C',  reason: 'Replenishes iron lost during menstrual bleeding and combats fatigue',    type: 'mineral' },
      { emoji: '⚡', name: 'Magnesium',   dose: '300–400 mg before bed',        reason: 'Relaxes uterine muscles, eases cramps, and improves sleep quality',      type: 'mineral' },
      { emoji: '🐟', name: 'Omega-3',     dose: '1–2 g daily with food',        reason: 'Reduces prostaglandins that drive cramping and inflammation',              type: 'omega'   },
      { emoji: '☀️', name: 'Vitamin D',   dose: '1,000–2,000 IU daily',         reason: 'Supports mood and immune function, often depleted during menstruation',    type: 'vitamin' },
      { emoji: '🔋', name: 'Vitamin B12', dose: '500–1,000 mcg daily',          reason: 'Helps sustain energy levels and red blood cell production',                type: 'vitamin' },
    ],
  },
  follicular: {
    headline: 'Build & energise',
    sub: 'Fuel rising oestrogen and follicle development',
    items: [
      { emoji: '🌿', name: 'B-Complex',  dose: '1 capsule daily with food',  reason: 'Supports oestrogen metabolism and sustained energy production',    type: 'vitamin'   },
      { emoji: '🦠', name: 'Probiotics', dose: '10–20 billion CFU daily',    reason: 'Promotes healthy oestrobolome for balanced oestrogen clearance',   type: 'probiotic' },
      { emoji: '🔬', name: 'Zinc',       dose: '8–15 mg daily',              reason: 'Essential for follicle maturation and immune resilience',           type: 'mineral'   },
      { emoji: '🍊', name: 'Vitamin C',  dose: '500–1,000 mg daily',         reason: 'Enhances iron absorption and provides antioxidant protection',      type: 'vitamin'   },
      { emoji: '⚙️', name: 'CoQ10',      dose: '100–200 mg daily with fat',  reason: 'Powers mitochondria in developing follicles and boosts energy',     type: 'vitamin'   },
    ],
  },
  ovulatory: {
    headline: 'Peak support',
    sub: 'Protect the egg and sustain peak hormone output',
    items: [
      { emoji: '🥚', name: 'Folate',    dose: '400–800 mcg daily',           reason: 'Critical for cell division and DNA integrity around ovulation',   type: 'vitamin' },
      { emoji: '🫐', name: 'Vitamin E', dose: '200–400 IU daily with food',  reason: 'Antioxidant shield for the maturing egg and follicle environment', type: 'vitamin' },
      { emoji: '🔬', name: 'Selenium',  dose: '55–200 mcg daily',            reason: 'Supports follicle rupture and protects egg from oxidative stress', type: 'mineral' },
      { emoji: '⚙️', name: 'CoQ10',     dose: '200–600 mg daily with fat',   reason: 'Maximises mitochondrial energy in the egg during peak fertility',  type: 'vitamin' },
      { emoji: '🐟', name: 'Omega-3',   dose: '1–2 g daily with food',       reason: 'Anti-inflammatory support during the ovulation inflammatory response', type: 'omega' },
    ],
  },
  luteal: {
    headline: 'Balance & calm',
    sub: 'Ease PMS and support progesterone',
    items: [
      { emoji: '⚡', name: 'Magnesium',        dose: '300–400 mg daily, evening',    reason: 'Reduces bloating, mood swings, headaches, and insomnia in the luteal phase', type: 'mineral' },
      { emoji: '🌿', name: 'Vitamin B6',        dose: '25–100 mg daily with food',    reason: 'Supports progesterone production and alleviates PMS symptoms',               type: 'vitamin' },
      { emoji: '🦋', name: 'Evening Primrose',  dose: '500–1,500 mg daily',           reason: 'GLA fatty acids reduce breast tenderness and PMS-related inflammation',       type: 'omega'   },
      { emoji: '🪨', name: 'Calcium',           dose: '600–1,200 mg daily',           reason: 'Clinical studies show calcium reduces PMS mood and physical symptoms',        type: 'mineral' },
      { emoji: '🌱', name: 'Vitex',             dose: '20–40 mg standardised daily',  reason: 'Supports LH surge balance and progesterone levels in the second half of cycle', type: 'herb'  },
    ],
  },
  unknown: {
    headline: 'Your supplements',
    sub: 'Log a period to get phase-specific recommendations',
    items: [],
  },
};

// Age-group overrides: only specify what differs from the adult baseline.
// Each entry can override dose/reason for existing items, remove items by name,
// and/or add new items.
interface SupOverride { name: string; dose?: string; reason?: string; }
interface PhaseOverride {
  headline?: string;
  sub?: string;
  overrides?: SupOverride[];  // patch matching items by name
  remove?: string[];          // remove items by name
  add?: Supplement[];         // append new items
}

const AGE_OVERRIDES: Record<Exclude<AgeGroup, 'adult'>, Partial<Record<Exclude<Phase, 'unknown'>, PhaseOverride>>> = {
  teen: {
    menstrual: {
      sub: 'Support your body and growing bones through blood loss',
      overrides: [
        {
          name: 'Iron',
          dose: '15 mg daily with vitamin C',
          reason: 'Teen RDA is 15 mg; replenishes iron lost during periods and supports growth-phase energy',
        },
      ],
      add: [
        { emoji: '🦴', name: 'Calcium', dose: '1,300 mg daily', reason: 'Peak bone-building years — teens need more calcium than adults to reach optimal bone density', type: 'mineral' },
      ],
    },
    follicular: {
      overrides: [
        {
          name: 'Vitamin D',
          dose: '600–1,000 IU daily',
          reason: 'Supports bone growth, immune function, and mood stability during adolescent development',
        },
      ],
      add: [
        { emoji: '🦴', name: 'Calcium', dose: '1,300 mg daily', reason: 'Daily calcium is critical through the teen years for achieving peak bone mass', type: 'mineral' },
      ],
    },
    ovulatory: {
      overrides: [
        {
          name: 'CoQ10',
          dose: '50–100 mg daily with fat',
          reason: 'Lower dose appropriate for teens; supports cellular energy without excess supplementation',
        },
      ],
    },
    luteal: {
      remove: ['Vitex'],
      add: [
        { emoji: '🦴', name: 'Calcium', dose: '1,300 mg daily', reason: 'Consistent calcium intake throughout the cycle supports bone density during the teen growth window', type: 'mineral' },
      ],
    },
  },

  peri: {
    menstrual: {
      sub: 'Support your body through blood loss and perimenopausal changes',
      overrides: [
        {
          name: 'Magnesium',
          dose: '400 mg before bed',
          reason: 'Higher-end dosing helps with perimenopausal sleep disruption, cramps, and mood fluctuations',
        },
        {
          name: 'Vitamin D',
          dose: '2,000 IU daily',
          reason: 'Bone density protection becomes a priority in perimenopause; higher D supports calcium absorption',
        },
      ],
    },
    follicular: {
      sub: 'Fuel oestrogen and protect follicle quality as cycles evolve',
      overrides: [
        {
          name: 'CoQ10',
          dose: '200–400 mg daily with fat',
          reason: 'Egg quality and mitochondrial energy decline with age — higher CoQ10 is particularly valuable in your 40s',
        },
        {
          name: 'B-Complex',
          dose: '1 capsule daily with food',
          reason: 'Supports oestrogen metabolism and energy during the hormonal shifts of perimenopause',
        },
      ],
      add: [
        { emoji: '☀️', name: 'Vitamin D3', dose: '2,000 IU daily with fat', reason: 'Perimenopausal bone loss accelerates; D3 with K2-rich foods optimises calcium use', type: 'vitamin' },
      ],
    },
    ovulatory: {
      sub: 'Maximise egg quality and protect against oxidative stress',
      overrides: [
        {
          name: 'CoQ10',
          dose: '400–600 mg daily with fat',
          reason: 'Peak CoQ10 dosing in perimenopause meaningfully improves egg mitochondrial energy and quality',
        },
        {
          name: 'Omega-3',
          dose: '2 g daily with food',
          reason: 'Higher Omega-3 intake supports both ovarian function and cardiovascular health in your 40s',
        },
      ],
    },
    luteal: {
      sub: 'Ease PMS and support progesterone during hormonal transition',
      overrides: [
        {
          name: 'Magnesium',
          dose: '400 mg daily, evening',
          reason: 'Higher-end dosing is especially beneficial during perimenopause for mood, sleep, and bloating',
        },
        {
          name: 'Vitex',
          dose: '20–40 mg standardised daily',
          reason: 'Particularly valuable in perimenopause for balancing LH surges and supporting progesterone in a shifting cycle',
        },
      ],
    },
  },

  mature: {
    menstrual: {
      headline: 'Replenish & protect',
      sub: 'Support your body with post-menopausal nutritional priorities',
      overrides: [
        {
          name: 'Iron',
          dose: '8 mg daily',
          reason: 'Post-menopausal iron needs drop significantly to 8 mg/day; excess iron becomes a risk factor',
        },
        {
          name: 'Magnesium',
          dose: '320–400 mg before bed',
          reason: 'Critical for bone density, sleep quality, and cardiovascular health post-menopause',
        },
        {
          name: 'Vitamin D',
          dose: '1,500–2,000 IU daily',
          reason: 'Bone protection is a top priority post-menopause; higher D3 supports calcium absorption and immune health',
        },
        {
          name: 'Vitamin B12',
          dose: '1,000 mcg sublingual daily',
          reason: 'B12 absorption from food decreases with age; sublingual form bypasses gut absorption issues',
        },
      ],
      add: [
        { emoji: '🦴', name: 'Calcium', dose: '1,200 mg daily in split doses', reason: 'Post-menopausal bone loss accelerates; 1,200 mg daily with vitamin D reduces fracture risk', type: 'mineral' },
      ],
    },
    follicular: {
      headline: 'Build & protect',
      sub: 'Fuel bone health, energy, and hormonal balance',
      overrides: [
        {
          name: 'B-Complex',
          dose: '1 capsule daily with food',
          reason: 'B vitamins support energy, nervous system health, and homocysteine metabolism — all increasingly important with age',
        },
        {
          name: 'CoQ10',
          dose: '200–300 mg daily with fat',
          reason: 'Mitochondrial energy production declines with age; CoQ10 supports heart health and cellular energy',
        },
      ],
      add: [
        { emoji: '🔋', name: 'Vitamin B12', dose: '1,000 mcg sublingual daily', reason: 'Sublingual B12 bypasses reduced gut absorption common after 50', type: 'vitamin' },
        { emoji: '☀️', name: 'Vitamin D3', dose: '1,500–2,000 IU daily with fat', reason: 'Post-menopausal bone and immune protection; take with K2-rich foods for best effect', type: 'vitamin' },
      ],
    },
    ovulatory: {
      headline: 'Cellular support',
      sub: 'Antioxidant and cardiovascular protection',
      overrides: [
        {
          name: 'CoQ10',
          dose: '200–400 mg daily with fat',
          reason: 'Heart and cellular protection becomes a greater priority post-menopause as oestrogen decline increases cardiovascular risk',
        },
        {
          name: 'Omega-3',
          dose: '2 g daily with food',
          reason: 'Higher Omega-3 intake supports cardiovascular, brain, and joint health — all key post-menopause priorities',
        },
      ],
    },
    luteal: {
      headline: 'Balance & strengthen',
      sub: 'Bone protection, mood support, and anti-inflammation',
      remove: ['Vitex'],
      overrides: [
        {
          name: 'Magnesium',
          dose: '320–400 mg daily, evening',
          reason: 'Supports bone density, sleep, and mood — particularly valuable as oestrogen protection wanes',
        },
        {
          name: 'Calcium',
          dose: '1,200 mg daily in split doses',
          reason: 'Post-menopausal women need 1,200 mg daily to counteract accelerated bone loss',
        },
        {
          name: 'Evening Primrose',
          dose: '500–1,000 mg daily',
          reason: 'GLA fatty acids help with vaginal dryness, hot flushes, and skin changes post-menopause',
        },
      ],
      add: [
        { emoji: '☀️', name: 'Vitamin D3', dose: '1,500–2,000 IU daily', reason: 'Bone and immune protection; works synergistically with calcium post-menopause', type: 'vitamin' },
        { emoji: '🐟', name: 'Omega-3', dose: '2 g daily with food', reason: 'Reduces inflammation, supports heart and brain health, and eases joint discomfort post-menopause', type: 'omega' },
      ],
    },
  },
};

// Apply age overrides on top of base data for a given phase
function getPhaseData(phase: Exclude<Phase, 'unknown'>, ageGroup: AgeGroup): PhaseData {
  const base = BASE_SUPPLEMENTS[phase];
  if (ageGroup === 'adult') return base;

  const override = AGE_OVERRIDES[ageGroup]?.[phase];
  if (!override) return base;

  let items = base.items.map(item => {
    const patch = override.overrides?.find(o => o.name === item.name);
    if (!patch) return item;
    return { ...item, ...(patch.dose ? { dose: patch.dose } : {}), ...(patch.reason ? { reason: patch.reason } : {}) };
  });

  if (override.remove) {
    items = items.filter(item => !override.remove!.includes(item.name));
  }
  if (override.add) {
    items = [...items, ...override.add];
  }

  return {
    headline: override.headline ?? base.headline,
    sub:      override.sub      ?? base.sub,
    items,
  };
}

// ── Static config ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SupType, string> = {
  mineral:   'Mineral',
  vitamin:   'Vitamin',
  omega:     'Omega / Oil',
  herb:      'Herb',
  probiotic: 'Probiotic',
};

const TYPE_STYLE: Record<SupType, { bg: string; color: string }> = {
  mineral:   { bg: 'var(--color-peat-mid)',         color: 'var(--color-peat-dark)'  },
  vitamin:   { bg: 'var(--color-blue-light)',        color: 'var(--color-blue-dark)'  },
  omega:     { bg: 'var(--color-phase-follicular)',  color: 'var(--color-blue-dark)'  },
  herb:      { bg: 'var(--color-moss-light)',        color: 'var(--color-moss-dark)'  },
  probiotic: { bg: 'var(--color-accent-light)',      color: 'var(--color-accent-dark)' },
};

const PHASE_STYLE: Record<Phase, { border: string; headerBg: string }> = {
  menstrual:  { border: 'var(--color-peat-deep)',  headerBg: 'var(--color-phase-menstrual)'  },
  follicular: { border: 'var(--color-blue-mid)',   headerBg: 'var(--color-phase-follicular)' },
  ovulatory:  { border: 'var(--color-moss-base)',  headerBg: 'var(--color-phase-ovulation)'  },
  luteal:     { border: 'var(--color-peat-deep)',  headerBg: 'var(--color-phase-luteal)'     },
  unknown:    { border: 'var(--color-peat-mid)',   headerBg: 'var(--color-peat-light)'       },
};

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all',       label: 'All'        },
  { value: 'mineral',   label: 'Minerals'   },
  { value: 'vitamin',   label: 'Vitamins'   },
  { value: 'omega',     label: 'Omegas'     },
  { value: 'herb',      label: 'Herbs'      },
  { value: 'probiotic', label: 'Probiotics' },
];

const AGE_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'teen',   label: 'Under 20' },
  { value: 'adult',  label: '20s–30s'  },
  { value: 'peri',   label: '40s'      },
  { value: 'mature', label: '50+'      },
];

const AGE_NOTE: Record<Exclude<AgeGroup, 'adult'>, string> = {
  teen:   'Doses adjusted for teen needs. Vitex removed — not recommended under 20.',
  peri:   'CoQ10 and Vitamin D doses raised for perimenopausal egg quality and bone support.',
  mature: 'Iron lowered to post-menopausal RDA. Calcium and Vitamin D raised. Vitex removed.',
};

const DISCLAIMER = 'Always consult a healthcare professional before starting or changing supplements.';

// ── Component ─────────────────────────────────────────────────────────────────

export function SupplementCard({ cycles, prediction }: Props) {
  const { ageGroup, setAgeGroup } = useSettings();
  const [filter, setFilter]       = useState<Filter>('all');
  const [viewPhase, setViewPhase] = useState<Exclude<Phase, 'unknown'> | null>(null);

  const cycleDay          = getCurrentCycleDay(cycles, prediction);
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;
  const todayPhase        = cycleDay != null
    ? getPhase(cycleDay, avgCycleLength, avgPeriodDuration)
    : 'unknown';

  const activePhase: Exclude<Phase, 'unknown'> = viewPhase
    ?? (todayPhase !== 'unknown' ? todayPhase : 'menstrual');
  const isToday = viewPhase === null;

  const navigate = (dir: 1 | -1) => {
    const idx  = CYCLE_PHASES.indexOf(activePhase);
    const next = CYCLE_PHASES[(idx + dir + CYCLE_PHASES.length) % CYCLE_PHASES.length];
    setViewPhase(next === todayPhase ? null : next);
    setFilter('all');
  };

  const goToToday = () => { setViewPhase(null); setFilter('all'); };

  const { headline, sub, items } = getPhaseData(activePhase, ageGroup);
  const style    = PHASE_STYLE[activePhase];
  const filtered = filter === 'all' ? items : items.filter(s => s.type === filter);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: `4px solid ${style.border}` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4" style={{ background: style.headerBg }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-peat-deep)' }}>
              Supplements
            </p>
            <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{headline}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>{sub}</p>
          </div>
          <div className="text-2xl shrink-0">💊</div>
        </div>

        {/* Phase navigation */}
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={goToToday}
              className="text-xs px-2 py-0.5 rounded-full transition-colors shrink-0"
              style={{ color: 'var(--color-blue-base)', border: '1px solid var(--color-blue-mid)' }}
            >
              ↩ Today
            </button>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => navigate(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-base transition-colors"
              style={{ background: 'rgba(255,255,255,0.4)', color: 'var(--color-peat-deep)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
            >
              ‹
            </button>
            <span
              className="text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--color-text-primary)' }}
            >
              {PHASE_LABELS[activePhase]}
              {isToday && todayPhase !== 'unknown' && (
                <span style={{ color: 'var(--color-peat-deep)', fontWeight: 400 }}> · Today</span>
              )}
            </span>
            <button
              onClick={() => navigate(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-base transition-colors"
              style={{ background: 'rgba(255,255,255,0.4)', color: 'var(--color-peat-deep)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {todayPhase === 'unknown' && viewPhase === null ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
            Log your first period to unlock phase-specific supplement recommendations.
          </p>
        </div>
      ) : (
        <>
          {/* Age group selector */}
          <div className="px-5 pt-4 pb-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium shrink-0" style={{ color: 'var(--color-peat-deep)' }}>Age</span>
              <div className="flex gap-1.5 flex-wrap">
                {AGE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setAgeGroup(value); setFilter('all'); }}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                    style={ageGroup === value
                      ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                      : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {ageGroup !== 'adult' && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-peat-deep)', fontStyle: 'italic' }}>
                {AGE_NOTE[ageGroup]}
              </p>
            )}
          </div>

          {/* Type filter */}
          <div className="px-5 pt-3 pb-3">
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

          {/* Supplement list */}
          <div style={{ borderTop: '1px solid var(--color-peat-light)' }}>

            {/* ── Mobile: stacked cards ── */}
            <div className="sm:hidden">
              {filtered.map((s, i) => {
                const ts = TYPE_STYLE[s.type];
                return (
                  <div
                    key={s.name}
                    className="px-4 py-3 space-y-1.5"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--color-peat-light)' : 'none' }}
                  >
                    {/* Row 1: emoji + name + type badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-base shrink-0">{s.emoji}</span>
                      <span className="text-sm font-semibold leading-tight flex-1" style={{ color: 'var(--color-text-primary)' }}>{s.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0"
                        style={{ background: ts.bg, color: ts.color }}
                      >
                        {TYPE_LABELS[s.type]}
                      </span>
                    </div>
                    {/* Row 2: dose */}
                    <p className="text-xs leading-snug pl-7" style={{ color: 'var(--color-text-primary)' }}>{s.dose}</p>
                    {/* Row 3: reason */}
                    <p className="text-xs leading-relaxed pl-7" style={{ color: 'var(--color-peat-deep)', fontWeight: 300 }}>{s.reason}</p>
                  </div>
                );
              })}
            </div>

            {/* ── Desktop: table grid ── */}
            <div className="hidden sm:block">
              {/* Column headers */}
              <div
                className="grid px-4 py-2 gap-x-3"
                style={{ gridTemplateColumns: '90px 90px 140px 1fr', borderBottom: '1px solid var(--color-peat-light)', background: 'var(--color-peat-light)' }}
              >
                {['Supplement', 'Type', 'Dose', 'Why it helps'].map(h => (
                  <p key={h} className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-peat-deep)' }}>{h}</p>
                ))}
              </div>
              {filtered.map((s, i) => {
                const ts = TYPE_STYLE[s.type];
                return (
                  <div
                    key={s.name}
                    className="grid px-4 py-3 gap-x-3 items-start"
                    style={{
                      gridTemplateColumns: '90px 90px 140px 1fr',
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--color-peat-light)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{s.emoji}</span>
                      <span className="text-xs font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>{s.name}</span>
                    </div>
                    <div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ background: ts.bg, color: ts.color }}
                      >
                        {TYPE_LABELS[s.type]}
                      </span>
                    </div>
                    <p className="text-xs leading-snug" style={{ color: 'var(--color-text-primary)' }}>{s.dose}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-peat-deep)', fontWeight: 300 }}>{s.reason}</p>
                  </div>
                );
              })}
            </div>

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
