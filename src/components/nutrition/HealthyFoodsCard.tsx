import { useState } from 'react';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseISO, startOfToday } from '../../lib/dateUtils';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
  bare?: boolean;
}

type Phase  = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type Filter = 'all' | 'eat' | 'avoid';

interface FoodItem { emoji: string; name: string; reason: string; type: 'eat' | 'avoid' }

function getPhase(d: number, len: number, dur: number): Phase {
  if (d <= dur)    return 'menstrual';
  if (d <= len-16) return 'follicular';
  if (d <= len-11) return 'ovulatory';
  if (d <= len)    return 'luteal';
  return 'unknown';
}

function getCurrentCycleDay(cycles: Cycle[], prediction: Prediction | null): number | null {
  const iso = new Date().toISOString().slice(0, 10);
  const past = cycles.filter(c => c.start_date <= iso);
  if (past.length > 0) {
    const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const d = differenceInDays(startOfToday(), parseISO(latest.start_date)) + 1;
    return d >= 1 ? d : null;
  }
  if (prediction) {
    const d = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (d >= 0) return Math.max(1, prediction.avgCycleLength - d);
  }
  return null;
}

const ALL_FOODS: Record<Phase, { headline: string; items: FoodItem[] }> = {
  menstrual: {
    headline: 'Replenish & restore',
    items: [
      { emoji: '🥩', name: 'Red meat & lentils',     reason: 'Replenish iron lost during bleeding',            type: 'eat'   },
      { emoji: '🌿', name: 'Spinach & kale',          reason: 'Iron + folate to support red blood cells',       type: 'eat'   },
      { emoji: '🐟', name: 'Salmon & sardines',       reason: 'Omega-3s ease cramps and inflammation',          type: 'eat'   },
      { emoji: '🍫', name: 'Dark chocolate',           reason: 'Magnesium to ease cramps and lift mood',         type: 'eat'   },
      { emoji: '🧄', name: 'Ginger & turmeric',       reason: 'Natural anti-inflammatories for pain relief',    type: 'eat'   },
      { emoji: '🍊', name: 'Citrus fruits',            reason: 'Vitamin C boosts iron absorption',               type: 'eat'   },
      { emoji: '☕', name: 'Caffeine',                 reason: 'Constricts blood vessels and worsens cramps',    type: 'avoid' },
      { emoji: '🍺', name: 'Alcohol',                 reason: 'Amplifies inflammation and cramp severity',      type: 'avoid' },
      { emoji: '🧂', name: 'Salty foods',             reason: 'Increase water retention and bloating',          type: 'avoid' },
      { emoji: '🍬', name: 'Refined sugar',           reason: 'Energy crashes deepen fatigue and mood dips',    type: 'avoid' },
      { emoji: '🧀', name: 'Excess dairy',            reason: 'Can worsen bloating and digestive sensitivity',  type: 'avoid' },
      { emoji: '🍟', name: 'Fried foods',             reason: 'Pro-inflammatory fats intensify period pain',    type: 'avoid' },
    ],
  },
  follicular: {
    headline: 'Energise & build',
    items: [
      { emoji: '🥚', name: 'Eggs',                    reason: 'Choline supports follicle development',          type: 'eat'   },
      { emoji: '🥦', name: 'Broccoli & cauliflower',  reason: 'Cruciferous veg help metabolise oestrogen',      type: 'eat'   },
      { emoji: '🍓', name: 'Berries & pomegranate',   reason: 'Antioxidants support rising oestrogen',          type: 'eat'   },
      { emoji: '🫘', name: 'Fermented foods',          reason: 'Probiotics prime gut for the month ahead',       type: 'eat'   },
      { emoji: '🌾', name: 'Quinoa & oats',            reason: 'Complex carbs sustain your growing energy',      type: 'eat'   },
      { emoji: '🥜', name: 'Almonds & flaxseed',      reason: 'Healthy fats fuel the follicular surge',         type: 'eat'   },
      { emoji: '🍟', name: 'Processed foods',          reason: 'Dampen rising energy and hormonal clarity',      type: 'avoid' },
      { emoji: '🍺', name: 'Alcohol',                 reason: 'Disrupts oestrogen metabolism at a critical window', type: 'avoid' },
      { emoji: '🍬', name: 'Refined sugar',           reason: 'Blood sugar spikes flatten the energy surge',    type: 'avoid' },
      { emoji: '🧂', name: 'Excess salt',             reason: 'Unnecessary bloat during your most energised phase', type: 'avoid' },
      { emoji: '☕', name: 'Excess caffeine',          reason: 'Overstimulation crowds out natural rising drive', type: 'avoid' },
      { emoji: '🌭', name: 'Cured meats',             reason: 'Nitrates and additives add unnecessary inflammation', type: 'avoid' },
    ],
  },
  ovulatory: {
    headline: 'Peak & protect',
    items: [
      { emoji: '🦪', name: 'Oysters & pumpkin seeds', reason: 'Zinc supports ovulation and fertility',          type: 'eat'   },
      { emoji: '🫐', name: 'Blueberries & tomatoes',  reason: 'Antioxidants protect the egg from oxidative stress', type: 'eat' },
      { emoji: '🥑', name: 'Avocado',                  reason: 'Vitamin E and healthy fats support hormone balance', type: 'eat' },
      { emoji: '🐟', name: 'Oily fish',                reason: 'DHA supports cervical fluid and egg quality',    type: 'eat'   },
      { emoji: '🥕', name: 'Colourful vegetables',     reason: 'Fibre helps clear excess oestrogen',             type: 'eat'   },
      { emoji: '💧', name: 'Water-rich foods',         reason: 'Cucumber, watermelon keep you hydrated at peak', type: 'eat'   },
      { emoji: '🍺', name: 'Alcohol',                  reason: 'Can interfere with ovulation timing and LH surge', type: 'avoid' },
      { emoji: '🥩', name: 'Saturated fats',           reason: 'Pro-inflammatory at peak hormone levels',        type: 'avoid' },
      { emoji: '☕', name: 'Excess caffeine',          reason: 'Disrupts hormonal signalling during the LH peak', type: 'avoid' },
      { emoji: '🍬', name: 'Refined sugar',           reason: 'Oxidative stress can affect egg quality',         type: 'avoid' },
      { emoji: '🍟', name: 'Fried foods',             reason: 'Trans fats disrupt the hormone balance at peak',  type: 'avoid' },
      { emoji: '🧂', name: 'Excess salt',             reason: 'Counteracts the hydration your body needs',       type: 'avoid' },
    ],
  },
  luteal: {
    headline: 'Calm & sustain',
    items: [
      { emoji: '🍌', name: 'Bananas & chickpeas',     reason: 'B6 boosts serotonin and reduces PMS mood dips',  type: 'eat'   },
      { emoji: '🥜', name: 'Cashews & sunflower seeds',reason: 'Magnesium eases bloating and tension',          type: 'eat'   },
      { emoji: '🍠', name: 'Sweet potato & squash',   reason: 'Complex carbs stabilise mood and energy',        type: 'eat'   },
      { emoji: '🥛', name: 'Dairy & leafy greens',    reason: 'Calcium reduces PMS symptoms significantly',     type: 'eat'   },
      { emoji: '🍵', name: 'Chamomile & fennel tea',  reason: 'Reduce bloating and calm the nervous system',    type: 'eat'   },
      { emoji: '🍗', name: 'Turkey & tofu',           reason: 'Tryptophan supports serotonin production',       type: 'eat'   },
      { emoji: '🍺', name: 'Alcohol',                 reason: 'Significantly amplifies PMS mood and symptoms',  type: 'avoid' },
      { emoji: '☕', name: 'Caffeine',                reason: 'Heightens anxiety and breast tenderness',         type: 'avoid' },
      { emoji: '🧂', name: 'Salty foods',             reason: 'Worsen bloating and water retention',            type: 'avoid' },
      { emoji: '🍬', name: 'Refined sugar',           reason: 'Blood sugar crashes deepen mood dips',           type: 'avoid' },
      { emoji: '🍟', name: 'Processed foods',         reason: 'Additives and trans fats worsen PMS inflammation', type: 'avoid' },
      { emoji: '🥛', name: 'Excess dairy',            reason: 'Can increase prostaglandins and worsen cramps',  type: 'avoid' },
    ],
  },
  unknown: {
    headline: 'Everyday foundations',
    items: [
      { emoji: '🌿', name: 'Leafy greens',            reason: 'Folate and iron for everyday vitality',          type: 'eat'   },
      { emoji: '🐟', name: 'Oily fish',               reason: 'Omega-3s support hormonal balance year-round',   type: 'eat'   },
      { emoji: '🫘', name: 'Legumes',                 reason: 'Fibre and plant protein for steady energy',       type: 'eat'   },
      { emoji: '🫐', name: 'Berries',                 reason: 'Antioxidants protect cells from daily stress',    type: 'eat'   },
      { emoji: '🥜', name: 'Nuts & seeds',            reason: 'Healthy fats and magnesium in every handful',    type: 'eat'   },
      { emoji: '🌾', name: 'Whole grains',            reason: 'B vitamins fuel your hormonal pathways',         type: 'eat'   },
      { emoji: '🍺', name: 'Alcohol',                 reason: 'Disrupts hormonal balance across all phases',    type: 'avoid' },
      { emoji: '🍬', name: 'Refined sugar',           reason: 'Blood sugar instability affects cycle regularity', type: 'avoid' },
      { emoji: '🍟', name: 'Processed foods',         reason: 'Inflammatory additives burden hormonal health',  type: 'avoid' },
      { emoji: '☕', name: 'Excess caffeine',         reason: 'Can heighten cortisol and disrupt cycle rhythms', type: 'avoid' },
      { emoji: '🧂', name: 'Excess salt',             reason: 'Promotes bloating and retention',                type: 'avoid' },
      { emoji: '🌭', name: 'Cured meats',             reason: 'Nitrates and preservatives add unnecessary load', type: 'avoid' },
    ],
  },
};

const PHASE_STYLE: Record<Phase, { fill: string; accent: string; label: string; text: string }> = {
  menstrual:  { fill: 'var(--color-phase-menstrual)',  accent: 'var(--color-peat-deep)', label: 'Menstrual',  text: 'var(--color-text-primary)' },
  follicular: { fill: 'var(--color-phase-follicular)', accent: 'var(--color-blue-base)', label: 'Follicular', text: 'var(--color-blue-dark)'    },
  ovulatory:  { fill: 'var(--color-phase-ovulation)',  accent: 'var(--color-moss-base)', label: 'Ovulatory',  text: 'var(--color-moss-dark)'    },
  luteal:     { fill: 'var(--color-phase-luteal)',     accent: 'var(--color-peat-deep)', label: 'Luteal',     text: 'var(--color-peat-deep)'    },
  unknown:    { fill: '#FFFFFF',                       accent: 'var(--color-moss-base)', label: '',           text: 'var(--color-peat-deep)'    },
};

const PHASES: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

const EAT_COLOR   = { bg: 'var(--color-moss-light)',   border: 'var(--color-moss-base)',   text: 'var(--color-moss-dark)'   };
const AVOID_COLOR = { bg: 'var(--color-accent-light)', border: 'var(--color-accent)',       text: 'var(--color-accent-dark)' };

export function HealthyFoodsCard({ cycles, prediction, bare = false }: Props) {
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;

  const cycleDay   = getCurrentCycleDay(cycles, prediction);
  const todayPhase: Phase = cycleDay != null
    ? getPhase(cycleDay, avgCycleLength, avgPeriodDuration)
    : 'unknown';
  const canNavigate = todayPhase !== 'unknown';

  const [viewPhase, setViewPhase] = useState<Phase | null>(null);
  const [filter, setFilter]       = useState<Filter>('all');
  const [selected, setSelected]   = useState<string | null>(null);

  const activePhase = viewPhase ?? todayPhase;
  const isToday     = viewPhase === null || viewPhase === todayPhase;

  const goToPhase = (direction: 1 | -1) => {
    const base = activePhase === 'unknown' ? 'menstrual' : activePhase;
    const idx  = PHASES.indexOf(base);
    const next = PHASES[(idx + direction + PHASES.length) % PHASES.length];
    setViewPhase(next === todayPhase ? null : next);
    setSelected(null);
  };

  const style = PHASE_STYLE[activePhase];
  const { headline, items } = ALL_FOODS[activePhase];

  const eatCount   = items.filter(i => i.type === 'eat').length;
  const avoidCount = items.filter(i => i.type === 'avoid').length;

  const visible = filter === 'all' ? items : items.filter(i => i.type === filter);
  const selectedItem = selected ? items.find(i => i.name === selected) ?? null : null;

  const handlePill = (name: string) => setSelected(prev => prev === name ? null : name);

  const inner = (
    <>
      {/* Header */}
      <div className={`px-5 flex items-center justify-between ${bare ? 'pt-3 pb-3' : 'pt-5 pb-4'}`} style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Eat well today</p>
          {activePhase !== 'unknown' && (
            <p className="text-xs mt-0.5" style={{ color: style.text }}>{headline}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canNavigate && !isToday && (
            <button onClick={() => { setViewPhase(null); setSelected(null); }}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: 'var(--color-blue-base)', border: '1px solid var(--color-blue-mid)' }}>
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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)' }}>🥗</div>
        </div>
      </div>

      {/* Filter strip */}
      <div className="px-5 py-2.5 flex items-center gap-1.5" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        {(['all', 'eat', 'avoid'] as Filter[]).map(f => {
          const active = filter === f;
          const count = f === 'all' ? items.length : f === 'eat' ? eatCount : avoidCount;
          const color = f === 'eat' ? EAT_COLOR : f === 'avoid' ? AVOID_COLOR : null;
          return (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelected(null); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={active
                ? color
                  ? { background: color.bg, color: color.text, border: `1px solid ${color.border}` }
                  : { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)', border: '1px solid var(--color-peat-dark)' }
                : { background: 'transparent', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }
              }
            >
              {f === 'eat' ? '✓ Eat' : f === 'avoid' ? '✕ Avoid' : 'All'}
              <span className="text-xs opacity-60">{count}</span>
            </button>
          );
        })}
        {selected && (
          <button onClick={() => setSelected(null)} className="ml-auto text-xs" style={{ color: 'var(--color-peat-mid)' }}>
            Clear ×
          </button>
        )}
      </div>

      {/* Pill grid */}
      <div className="px-5 py-3 flex flex-wrap gap-2">
        {visible.map(item => {
          const isSelected = selected === item.name;
          const c = item.type === 'eat' ? EAT_COLOR : AVOID_COLOR;
          return (
            <button
              key={item.name}
              onClick={() => handlePill(item.name)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
              style={isSelected
                ? { background: c.bg, color: c.text, border: `1.5px solid ${c.border}`, fontWeight: 600 }
                : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }
              }
            >
              <span className="leading-none">{item.emoji}</span>
              {item.name}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: item.type === 'eat' ? 'var(--color-moss-base)' : 'var(--color-accent)' }}
              />
            </button>
          );
        })}
      </div>

      {/* Expanded detail */}
      {selectedItem && (
        <div
          className="mx-5 mb-3 rounded-xl px-4 py-3"
          style={{
            background: selectedItem.type === 'eat' ? 'var(--color-moss-light)' : 'var(--color-accent-light)',
            borderLeft: `3px solid ${selectedItem.type === 'eat' ? 'var(--color-moss-base)' : 'var(--color-accent)'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base leading-none">{selectedItem.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: selectedItem.type === 'eat' ? 'var(--color-moss-dark)' : 'var(--color-accent-dark)' }}>
              {selectedItem.type === 'eat' ? '✓ Eat' : '✕ Avoid'} · {selectedItem.name}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>{selectedItem.reason}</p>
        </div>
      )}

      {/* Footer */}
      <div className={`px-5 ${bare ? 'py-2' : 'py-3'}`} style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
          {activePhase === 'unknown'
            ? 'Log a period to see foods tailored to your current cycle phase.'
            : 'Tap any item to see why · General guidance, not medical advice.'}
        </p>
      </div>
    </>
  );

  if (bare) return inner;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: `4px solid ${style.accent}` }}>
      {inner}
    </div>
  );
}
