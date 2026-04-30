import { useState } from 'react';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
  bare?: boolean;
}

type Phase   = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type Season  = 'spring' | 'summer' | 'autumn' | 'winter';
type Filter  = 'all' | 'seasonal' | 'bouquet' | 'potted' | 'dried';

interface FloralItem {
  emoji: string;
  name: string;
  reason: string;
  type: 'bouquet' | 'potted' | 'dried';
  /** Empty array = year-round */
  seasons: Season[];
}

// ── Season helpers ────────────────────────────────────────────────────────────

const SEASON_EMOJI: Record<Season, string> = {
  spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️',
};
const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter',
};

function getCurrentSeason(): Season {
  const m = new Date().getMonth() + 1; // 1–12
  if (m >= 3 && m <= 5)  return 'spring';
  if (m >= 6 && m <= 8)  return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function isInSeason(item: FloralItem, season: Season): boolean {
  return item.seasons.length === 0 || item.seasons.includes(season);
}

// ── Phase helpers ─────────────────────────────────────────────────────────────

function getPhase(d: number, len: number, dur: number): Phase {
  if (d <= dur)    return 'menstrual';
  if (d <= len-16) return 'follicular';
  if (d <= len-11) return 'ovulatory';
  if (d <= len)    return 'luteal';
  return 'unknown';
}

function getCurrentCycleDay(cycles: Cycle[], prediction: Prediction | null): number | null {
  const iso = todayLocalISO();
  const past = cycles.filter(c => c.start_date <= iso);
  if (past.length > 0) {
    const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const d = differenceInDays(startOfToday(), parseLocalDate(latest.start_date)) + 1;
    return d >= 1 ? d : null;
  }
  if (prediction) {
    const d = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (d >= 0) return Math.max(1, prediction.avgCycleLength - d);
  }
  return null;
}

// ── Floral data ───────────────────────────────────────────────────────────────

const ALL_FLORALS: Record<Phase, { headline: string; items: FloralItem[] }> = {
  menstrual: {
    headline: 'Comfort & warmth',
    items: [
      { emoji: '🌹', name: 'Deep red roses',        type: 'bouquet', seasons: [],                        reason: 'Velvety petals and a rich scent anchor you during low-energy days — choose garden roses for maximum fragrance' },
      { emoji: '🌸', name: 'Burgundy peonies',      type: 'bouquet', seasons: ['spring', 'summer'],      reason: 'Lush, heavy blooms mirror the fullness of the body this phase; buy them in bud and they\'ll open slowly over the week' },
      { emoji: '💜', name: 'Dark dahlias',          type: 'bouquet', seasons: ['summer', 'autumn'],      reason: 'Introspective and dramatic — café au lait and blackberry varieties suit the inward pull of menstruation' },
      { emoji: '🪻', name: 'Dried lavender bundle', type: 'dried',   seasons: [],                        reason: 'Calming scent eases cramps and tension; tie a few stems together and place near your bed or bath' },
      { emoji: '🍃', name: 'Eucalyptus wreath',     type: 'dried',   seasons: [],                        reason: 'Anti-inflammatory aroma supports the body; hang in a steamy bathroom to release the oils' },
      { emoji: '🌿', name: 'Potted fern',           type: 'potted',  seasons: [],                        reason: 'Deeply forgiving and low-maintenance — thrives on humidity and indirect light even when you can\'t tend to it' },
    ],
  },
  follicular: {
    headline: 'Fresh & curious',
    items: [
      { emoji: '🌸', name: 'Cherry blossom',        type: 'bouquet', seasons: ['spring'],                reason: 'Fleeting and luminous — perfectly matched to follicular\'s sense of possibility; add pussy willow for structure' },
      { emoji: '💐', name: 'White ranunculus',       type: 'bouquet', seasons: ['winter', 'spring'],      reason: 'Layered petals unfurling like new ideas; one of the most architecturally satisfying blooms, long-lasting in a vase' },
      { emoji: '🌼', name: 'Yellow mimosa',          type: 'bouquet', seasons: ['winter', 'spring'],      reason: 'Feathery pom-poms radiate the cheerfulness of rising oestrogen; dry them upside-down and they\'ll keep for months' },
      { emoji: '🌱', name: 'Forced hyacinth bulb',  type: 'potted',  seasons: ['winter', 'spring'],      reason: 'Start one at the beginning of this phase and watch it bloom alongside you — the scent fills an entire room' },
      { emoji: '🪴', name: 'Trailing pothos',        type: 'potted',  seasons: [],                        reason: 'Grows visibly between waterings; place on a shelf and watch new leaves unfurl with your energy' },
      { emoji: '🌾', name: 'Dried pampas grass',    type: 'dried',   seasons: [],                        reason: 'Airy plumes bring lightness and movement — a single stem in a tall vase needs nothing else' },
    ],
  },
  ovulatory: {
    headline: 'Bold & radiant',
    items: [
      { emoji: '🌻', name: 'Sunflowers',            type: 'bouquet', seasons: ['summer', 'autumn'],      reason: 'Face-forward and unapologetically bold; mix with lime-green chrysanthemums for a more editorial arrangement' },
      { emoji: '🌺', name: 'Full-bloom peonies',    type: 'bouquet', seasons: ['spring', 'summer'],      reason: 'Full, generous, intensely fragrant at the height of their bloom — the quintessential ovulatory flower' },
      { emoji: '🌷', name: 'Parrot tulips',         type: 'bouquet', seasons: ['spring'],                reason: 'Flame-edged and electric; let them flop open in a wide-mouthed vase for dramatic effect' },
      { emoji: '🌸', name: 'Protea',                type: 'bouquet', seasons: [],                        reason: 'Architectural and striking, imported year-round; makes a statement that lasts two weeks in water' },
      { emoji: '🌺', name: 'Bird of paradise',      type: 'potted',  seasons: [],                        reason: 'Tropical and theatrical — a natural centrepiece that suits the social, expressive energy of ovulatory' },
      { emoji: '🍊', name: 'Dried citrus garland',  type: 'dried',   seasons: ['winter', 'spring'],      reason: 'Sliced oranges or lemons dried and threaded together bring a bright, zesty accent that echoes ovulatory clarity' },
    ],
  },
  luteal: {
    headline: 'Soft & grounding',
    items: [
      { emoji: '🪻', name: 'Lavender bundle',       type: 'bouquet', seasons: ['summer'],                reason: 'Shown to reduce cortisol; hang upside-down to dry and the calming effect extends for weeks after the petals fade' },
      { emoji: '🌸', name: 'Blush cosmos',          type: 'bouquet', seasons: ['summer', 'autumn'],      reason: 'Delicate and unpretentious — soft enough for a quieter phase; they move beautifully in a breeze from a window' },
      { emoji: '🌼', name: 'Chamomile stems',       type: 'bouquet', seasons: ['spring', 'summer'],      reason: 'Small daisy-like blooms with a honey-apple scent; dry the stems and add to your tea ritual for a double benefit' },
      { emoji: '🟡', name: 'Warm marigolds',        type: 'bouquet', seasons: ['summer', 'autumn'],      reason: 'Earthy and grounding; traditionally anti-inflammatory, they also repel indoor pests' },
      { emoji: '🌿', name: 'Potted rosemary',       type: 'potted',  seasons: [],                        reason: 'Herbaceous aroma lifts brain fog; place on a sunny windowsill and snip sprigs into a bath or diffuser' },
      { emoji: '🍂', name: 'Dried rose hips',       type: 'dried',   seasons: ['autumn', 'winter'],      reason: 'Rich terracotta tones and gnarled texture ground the mood; arrange in a low bowl with dried seed pods' },
    ],
  },
  unknown: {
    headline: 'Flowers for every week',
    items: [
      { emoji: '🌹', name: 'Roses',                 type: 'bouquet', seasons: [],                        reason: 'A classic that holds meaning in every season — choose garden roses for fragrance and longevity' },
      { emoji: '🌸', name: 'Peonies',               type: 'bouquet', seasons: ['spring', 'summer'],      reason: 'Full-bodied and fragrant; a mood-lifter at any point in the cycle' },
      { emoji: '🌻', name: 'Sunflowers',            type: 'bouquet', seasons: ['summer', 'autumn'],      reason: 'Cheerful and long-lasting — easy brightness without upkeep' },
      { emoji: '🪻', name: 'Lavender',              type: 'dried',   seasons: [],                        reason: 'Calming scent and beautiful fresh or dried; works in every phase as a bedside arrangement' },
      { emoji: '🌿', name: 'Eucalyptus',            type: 'dried',   seasons: [],                        reason: 'Adds texture and a clean, restorative aroma to any arrangement; lasts weeks without water' },
      { emoji: '🪴', name: 'Pothos',                type: 'potted',  seasons: [],                        reason: 'Nearly indestructible — thrives in low light and irregular watering, growing with you week to week' },
    ],
  },
};

// ── Styles ────────────────────────────────────────────────────────────────────

const PHASE_STYLE: Record<Phase, { fill: string; accent: string; label: string; text: string }> = {
  menstrual:  { fill: 'var(--color-phase-menstrual)',  accent: 'var(--color-peat-deep)', label: 'Menstrual',  text: 'var(--color-text-primary)' },
  follicular: { fill: 'var(--color-phase-follicular)', accent: 'var(--color-blue-base)', label: 'Follicular', text: 'var(--color-blue-dark)'    },
  ovulatory:  { fill: 'var(--color-phase-ovulation)',  accent: 'var(--color-moss-base)', label: 'Ovulatory',  text: 'var(--color-moss-dark)'    },
  luteal:     { fill: 'var(--color-phase-luteal)',     accent: 'var(--color-peat-deep)', label: 'Luteal',     text: 'var(--color-peat-deep)'    },
  unknown:    { fill: '#FFFFFF',                       accent: 'var(--color-moss-base)', label: '',           text: 'var(--color-peat-deep)'    },
};

const PHASES: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

const TYPE_COLOR: Record<'bouquet' | 'potted' | 'dried', { bg: string; border: string; text: string; dot: string }> = {
  bouquet: { bg: 'var(--color-moss-light)',   border: 'var(--color-moss-base)',  text: 'var(--color-moss-dark)',   dot: 'var(--color-moss-base)'  },
  potted:  { bg: 'var(--color-blue-light)',   border: 'var(--color-blue-base)',  text: 'var(--color-blue-dark)',   dot: 'var(--color-blue-base)'  },
  dried:   { bg: 'var(--color-accent-light)', border: 'var(--color-accent)',     text: 'var(--color-accent-dark)', dot: 'var(--color-accent)'     },
};

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All', seasonal: 'In season', bouquet: 'Bouquet', potted: 'Potted', dried: 'Dried',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FloralCard({ cycles, prediction, bare = false }: Props) {
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
  const currentSeason = getCurrentSeason();

  const goToPhase = (direction: 1 | -1) => {
    const base = activePhase === 'unknown' ? 'menstrual' : activePhase;
    const idx  = PHASES.indexOf(base);
    const next = PHASES[(idx + direction + PHASES.length) % PHASES.length];
    setViewPhase(next === todayPhase ? null : next);
    setSelected(null);
  };

  const style = PHASE_STYLE[activePhase];
  const { headline, items } = ALL_FLORALS[activePhase];

  // Sort in-season items first
  const sortedItems = [...items].sort((a, b) => {
    const aIn = isInSeason(a, currentSeason) ? 0 : 1;
    const bIn = isInSeason(b, currentSeason) ? 0 : 1;
    return aIn - bIn;
  });

  const countOf = (f: Filter) => {
    if (f === 'all')      return sortedItems.length;
    if (f === 'seasonal') return sortedItems.filter(i => isInSeason(i, currentSeason)).length;
    return sortedItems.filter(i => i.type === f).length;
  };

  const visible = filter === 'all'      ? sortedItems
    : filter === 'seasonal' ? sortedItems.filter(i => isInSeason(i, currentSeason))
    : sortedItems.filter(i => i.type === filter);

  const selectedItem = selected ? items.find(i => i.name === selected) ?? null : null;
  const handlePill = (name: string) => setSelected(prev => prev === name ? null : name);

  const seasonLabel = items.some(i => i.seasons.length === 0)
    ? null
    : `${SEASON_EMOJI[currentSeason]} ${SEASON_LABEL[currentSeason]}`;

  const inner = (
    <>
      {/* Header */}
      <div className={`px-5 flex items-center justify-between ${bare ? 'pt-3 pb-3' : 'pt-5 pb-4'}`} style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Floral arrangements</p>
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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-phase-ovulation)' }}>🌸</div>
        </div>
      </div>

      {/* Filter strip */}
      <div className="px-5 py-2.5 flex items-center gap-1.5 flex-wrap" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        {(['all', 'seasonal', 'bouquet', 'potted', 'dried'] as Filter[]).map(f => {
          const active = filter === f;
          const count  = countOf(f);
          const isSeasonal = f === 'seasonal';
          return (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelected(null); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={active
                ? isSeasonal
                  ? { background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)', border: '1px solid var(--color-moss-base)' }
                  : f !== 'all'
                    ? { background: TYPE_COLOR[f as 'bouquet'|'potted'|'dried'].bg, color: TYPE_COLOR[f as 'bouquet'|'potted'|'dried'].text, border: `1px solid ${TYPE_COLOR[f as 'bouquet'|'potted'|'dried'].border}` }
                    : { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)', border: '1px solid var(--color-peat-dark)' }
                : { background: 'transparent', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }
              }
            >
              {isSeasonal && `${SEASON_EMOJI[currentSeason]} `}{FILTER_LABELS[f]}
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
          const isSelected  = selected === item.name;
          const inSeason    = isInSeason(item, currentSeason);
          const c = TYPE_COLOR[item.type];
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
              {inSeason && (
                <span className="leading-none text-xs" title={`In season: ${SEASON_LABEL[currentSeason]}`}>
                  {SEASON_EMOJI[currentSeason]}
                </span>
              )}
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
            </button>
          );
        })}
      </div>

      {/* Expanded detail */}
      {selectedItem && (() => {
        const inSeason = isInSeason(selectedItem, currentSeason);
        const seasonNote = selectedItem.seasons.length === 0
          ? 'Available year-round'
          : `Best in: ${selectedItem.seasons.map(s => `${SEASON_EMOJI[s]} ${SEASON_LABEL[s]}`).join(' · ')}`;
        return (
          <div
            className="mx-5 mb-3 rounded-xl px-4 py-3"
            style={{
              background: TYPE_COLOR[selectedItem.type].bg,
              borderLeft: `3px solid ${TYPE_COLOR[selectedItem.type].border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base leading-none">{selectedItem.emoji}</span>
              <span className="text-xs font-semibold" style={{ color: TYPE_COLOR[selectedItem.type].text }}>
                {FILTER_LABELS[selectedItem.type]} · {selectedItem.name}
              </span>
              {inSeason && (
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)', border: '1px solid var(--color-moss-base)', whiteSpace: 'nowrap' }}
                >
                  {SEASON_EMOJI[currentSeason]} In season
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--color-peat-deep)' }}>{selectedItem.reason}</p>
            <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>{seasonNote}</p>
          </div>
        );
      })()}

      {/* Footer */}
      <div className={`px-5 ${bare ? 'py-2' : 'py-3'}`} style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
          {activePhase === 'unknown'
            ? 'Log a period to see floral ideas tailored to your current cycle phase.'
            : `${seasonLabel ? `${seasonLabel} · ` : ''}Tap any flower to learn more · Availability varies by region.`}
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
