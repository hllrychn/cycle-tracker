import { useState } from 'react';
import type { Cycle, Prediction } from '../../types';

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
  bare?: boolean;
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type WorldFilter = 'all' | 'old' | 'new';

const PHASES: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

function getPhase(cycleDay: number, avgCycleLength: number, avgPeriodDuration: number): Phase {
  if (cycleDay <= avgPeriodDuration)   return 'menstrual';
  if (cycleDay <= avgCycleLength - 16) return 'follicular';
  if (cycleDay <= avgCycleLength - 11) return 'ovulatory';
  if (cycleDay <= avgCycleLength)      return 'luteal';
  return 'unknown';
}

function getCurrentPhase(cycles: Cycle[], prediction: Prediction | null, avgCycleLength: number, avgPeriodDuration: number): Phase {
  const todayISO = todayLocalISO();
  const pastCycles = cycles.filter(c => c.start_date <= todayISO);
  if (pastCycles.length > 0) {
    const latest = [...pastCycles].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const day = differenceInDays(startOfToday(), parseLocalDate(latest.start_date)) + 1;
    if (day >= 1) return getPhase(day, avgCycleLength, avgPeriodDuration);
  }
  if (prediction) {
    const daysUntil = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (daysUntil >= 0) {
      const day = Math.max(1, avgCycleLength - daysUntil);
      return getPhase(day, avgCycleLength, avgPeriodDuration);
    }
  }
  return 'unknown';
}

interface WineItem {
  emoji: string;
  name: string;
  reason: string;
  world?: 'old' | 'new'; // undefined = shown in all views (advisories, ambiguous varietals)
}

const WINES: Record<Phase, { headline: string; mood: string; items: WineItem[] }> = {
  menstrual: {
    headline: 'Comfort & warmth',
    mood: 'Low and slow — reach for something velvety and warming.',
    items: [
      { emoji: '🍷', name: 'Malbec',           world: 'new', reason: 'Plush tannins and dark fruit soothe without overwhelming a sensitive system' },
      { emoji: '🍷', name: 'Merlot',            world: 'old', reason: 'Soft, rounded, and easy — the comfort food of red wines' },
      { emoji: '🍷', name: 'Grenache',          world: 'old', reason: 'Low tannin and gently spiced, kind to cramp-prone days' },
      { emoji: '🫖', name: 'Mulled wine',       world: 'old', reason: 'Warming spices like cinnamon and clove actively ease inflammation' },
      { emoji: '🍷', name: 'Sangiovese',        world: 'old', reason: 'Medium body with cherry brightness — lifts mood without taxing energy' },
      { emoji: '🥂', name: 'Skip the whites',              reason: 'High-acid whites can worsen bloating and sensitivity this week' },
    ],
  },
  follicular: {
    headline: 'Light & lively',
    mood: 'Energy is building — match it with something crisp and adventurous.',
    items: [
      { emoji: '🥂', name: 'Sauvignon Blanc',              reason: 'Zesty citrus and fresh herbs mirror your rising curiosity and drive' },
      { emoji: '🥂', name: 'Prosecco',          world: 'old', reason: 'Celebratory bubbles suit your most socially confident phase' },
      { emoji: '🥂', name: 'Pinot Grigio',      world: 'old', reason: 'Crisp and clean — lets your natural energy do the talking' },
      { emoji: '🍷', name: 'Pinot Noir',                    reason: 'Light-bodied red with earthy elegance for evenings winding down' },
      { emoji: '🥂', name: 'Grüner Veltliner', world: 'old', reason: 'Peppery and mineral — great for trying something new this phase' },
      { emoji: '🥂', name: 'Cava',              world: 'old', reason: 'Spanish fizz with toasty depth — ideal for spontaneous plans' },
    ],
  },
  ovulatory: {
    headline: 'Bold & celebratory',
    mood: 'You\'re at your peak — pour something worthy of the occasion.',
    items: [
      { emoji: '🥂', name: 'Champagne',         world: 'old', reason: 'You\'re magnetic right now — effervescent wines match the energy' },
      { emoji: '🌸', name: 'Dry Rosé',                       reason: 'Strawberry and peach notes suit your warmth and open social window' },
      { emoji: '🥂', name: 'Viognier',          world: 'old', reason: 'Floral, full-bodied white that matches peak oestrogen\'s lushness' },
      { emoji: '🍷', name: 'Tempranillo',       world: 'old', reason: 'Cherry-rich with subtle spice — bold enough for your boldest phase' },
      { emoji: '🥂', name: 'White Burgundy',    world: 'old', reason: 'Chardonnay at its most elegant — earthy, creamy, complex' },
      { emoji: '🍷', name: 'Zinfandel',         world: 'new', reason: 'Fruit-forward and high-spirited — built for your social peak' },
    ],
  },
  luteal: {
    headline: 'Soft & grounding',
    mood: 'Progesterone is rising — choose wines that calm rather than stimulate.',
    items: [
      { emoji: '🍷', name: 'Pinot Noir',                    reason: 'Light tannins and red fruit comfort without spiking tension' },
      { emoji: '🥂', name: 'Off-dry Riesling', world: 'old', reason: 'A touch of sweetness steadies mood swings and sugar cravings' },
      { emoji: '🍷', name: 'Barbera',          world: 'old', reason: 'Low tannin, bright acidity — gentle on a system running low' },
      { emoji: '🥂', name: 'Chenin Blanc',                  reason: 'Honeyed and soft — pairs beautifully with comfort food cravings' },
      { emoji: '🍷', name: 'Dolcetto',         world: 'old', reason: 'Bitter-cherry finish and low acid ease the luteal fog' },
      { emoji: '💧', name: 'Go easy overall',              reason: 'Alcohol amplifies PMS symptoms — one glass counts more this week' },
    ],
  },
  unknown: {
    headline: 'Wine for every week',
    mood: 'Log a period to unlock wine pairings tailored to your cycle phase.',
    items: [
      { emoji: '🍷', name: 'Pinot Noir',                    reason: 'The most cycle-friendly red — light, soft and universally kind' },
      { emoji: '🥂', name: 'Sauvignon Blanc',              reason: 'Crisp and clean, easy to enjoy at any point in the month' },
      { emoji: '🥂', name: 'Dry Rosé',                      reason: 'Versatile and food-friendly across all four phases' },
      { emoji: '🥂', name: 'Prosecco',         world: 'old', reason: 'Lower alcohol than Champagne — a gentle celebratory choice' },
      { emoji: '🍷', name: 'Grenache',         world: 'old', reason: 'Soft tannins and warm fruit that work regardless of where you are' },
      { emoji: '💧', name: 'Hydrate alongside',            reason: 'One glass of water per glass of wine smooths out any phase' },
    ],
  },
};

const PHASE_STYLE: Record<Phase, { fill: string; accent: string; label: string; text: string }> = {
  menstrual:  { fill: 'var(--color-phase-menstrual)',  accent: 'var(--color-peat-deep)',  label: 'Menstrual',  text: 'var(--color-text-primary)' },
  follicular: { fill: 'var(--color-phase-follicular)', accent: 'var(--color-blue-base)',  label: 'Follicular', text: 'var(--color-blue-dark)'    },
  ovulatory:  { fill: 'var(--color-phase-ovulation)',  accent: 'var(--color-moss-base)',  label: 'Ovulatory',  text: 'var(--color-moss-dark)'    },
  luteal:     { fill: 'var(--color-phase-luteal)',     accent: 'var(--color-peat-deep)',  label: 'Luteal',     text: 'var(--color-peat-deep)'    },
  unknown:    { fill: '#FFFFFF',                       accent: 'var(--color-accent)',     label: '',           text: 'var(--color-peat-deep)'    },
};

const labelColor = 'var(--color-text-primary)';

const WORLD_FILTER_LABELS: Record<WorldFilter, string> = {
  all: 'All',
  old: 'Old World',
  new: 'New World',
};

function WorldFilterToggle({ value, onChange }: { value: WorldFilter; onChange: (v: WorldFilter) => void }) {
  return (
    <div className="flex items-center gap-1">
      {(['all', 'old', 'new'] as WorldFilter[]).map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className="text-xs px-2 py-0.5 rounded-full transition-colors"
          style={{
            background: value === f ? 'var(--color-peat-deep)' : 'transparent',
            color: value === f ? 'var(--color-text-light)' : 'var(--color-peat-deep)',
            border: '1px solid var(--color-peat-mid)',
          }}
        >
          {WORLD_FILTER_LABELS[f]}
        </button>
      ))}
    </div>
  );
}

export function WinePairingCard({ cycles, prediction, bare = false }: Props) {
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;

  const todayPhase = getCurrentPhase(cycles, prediction, avgCycleLength, avgPeriodDuration);
  const canNavigate = todayPhase !== 'unknown';

  const [viewPhase, setViewPhase] = useState<Phase | null>(null);
  const [worldFilter, setWorldFilter] = useState<WorldFilter>('all');
  const [shareToast, setShareToast] = useState<'copied' | 'shared' | null>(null);

  const activePhase = viewPhase ?? todayPhase;
  const isToday     = viewPhase === null || viewPhase === todayPhase;

  const goToPhase = (direction: 1 | -1) => {
    const base = activePhase === 'unknown' ? 'menstrual' : activePhase;
    const idx  = PHASES.indexOf(base);
    const next = PHASES[(idx + direction + PHASES.length) % PHASES.length];
    setViewPhase(next === todayPhase ? null : next);
  };

  const phase  = activePhase;
  const style  = PHASE_STYLE[phase];
  const { headline, mood, items } = WINES[phase];

  const visibleItems = worldFilter === 'all'
    ? items
    : items.filter(item => !item.world || item.world === worldFilter);

  const handleShare = async () => {
    const decorative = `ִֶָ𓂃 ࣪˖ ִִֶֶָ🍾་༘࿐`;
    const phaseLine = phase !== 'unknown' ? `${style.label} phase · ${headline}` : headline;
    const intro = `Hello, I'd like to share some wine pairings with you.`;
    const sections = visibleItems.map(({ emoji, name, reason }) => `${emoji} ${name}\n${reason}`);
    const filterNote = worldFilter !== 'all' ? ` (${WORLD_FILTER_LABELS[worldFilter]})` : '';
    const text = `${intro}\n\n${decorative}\n\nWine pairings${filterNote}\n${phaseLine}\n\n${mood}\n\n${sections.join('\n\n')}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        setShareToast('shared');
      } catch {
        return;
      }
    } else {
      await navigator.clipboard.writeText(text);
      setShareToast('copied');
    }
    setTimeout(() => setShareToast(null), 2000);
  };

  if (bare) {
    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-5 pt-3 pb-2.5 flex flex-col gap-2 shrink-0" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold" style={{ color: labelColor }}>Wine pairings</p>
            <div className="flex items-center gap-2 shrink-0">
              {canNavigate && !isToday && (
                <button
                  onClick={() => setViewPhase(null)}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ color: 'var(--color-blue-base)', border: '1px solid var(--color-blue-mid)' }}
                >
                  ↩ Today
                </button>
              )}
              {phase !== 'unknown' && (
                <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: style.fill, color: style.text }}>
                  {style.label}
                </span>
              )}
              {canNavigate && (
                <div className="flex items-center gap-1">
                  <button onClick={() => goToPhase(-1)} className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: labelColor }}>‹</button>
                  <button onClick={() => goToPhase(1)}  className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: labelColor }}>›</button>
                </div>
              )}
              <div className="relative">
                <button
                  onClick={handleShare}
                  className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: 'var(--color-peat-deep)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = labelColor)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
                  title="Share pairings"
                >
                  <ShareIcon />
                </button>
                {shareToast && (
                  <div
                    className="absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs pointer-events-none"
                    style={{ background: 'var(--color-peat-dark)', color: 'var(--color-text-light)', zIndex: 50 }}
                  >
                    {shareToast === 'copied' ? 'Copied!' : 'Shared!'}
                  </div>
                )}
              </div>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-phase-menstrual)' }}>🍷</div>
            </div>
          </div>
          <WorldFilterToggle value={worldFilter} onChange={setWorldFilter} />
        </div>

        {/* Mood line */}
        <div className="px-5 py-2" style={{ borderBottom: '1px solid var(--color-peat-light)', background: phase !== 'unknown' ? style.fill : 'transparent' }}>
          <p className="text-xs italic" style={{ color: style.text }}>{mood}</p>
        </div>

        {/* Wine grid */}
        <div className="grid grid-cols-2 gap-px" style={{ background: 'var(--color-peat-light)' }}>
          {visibleItems.map(({ emoji, name, reason }) => (
            <div key={name} className="px-4 py-2" style={{ background: '#FFFFFF' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm leading-none">{emoji}</span>
                <span className="text-xs font-medium" style={{ color: labelColor }}>{name}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>{reason}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
          <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
            For enjoyment — drink responsibly and adjust to your own tolerance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: `4px solid ${style.accent}` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex flex-col gap-2" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: labelColor }}>Wine pairings</p>
            <p className="text-xs mt-0.5" style={{ color: style.text }}>{headline}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canNavigate && !isToday && (
              <button
                onClick={() => setViewPhase(null)}
                className="text-xs px-2 py-0.5 rounded-full transition-colors"
                style={{ color: 'var(--color-blue-base)', border: '1px solid var(--color-blue-mid)' }}
              >
                ↩ Today
              </button>
            )}
            {phase !== 'unknown' && (
              <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: style.fill, color: style.text }}>
                {style.label}
              </span>
            )}
            {canNavigate && (
              <div className="flex items-center gap-1">
                <button onClick={() => goToPhase(-1)} className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: labelColor }}>‹</button>
                <button onClick={() => goToPhase(1)}  className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: labelColor }}>›</button>
              </div>
            )}
            <div className="relative">
              <button
                onClick={handleShare}
                className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
                style={{ color: 'var(--color-peat-deep)' }}
                onMouseEnter={e => (e.currentTarget.style.color = labelColor)}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
                title="Share pairings"
              >
                <ShareIcon />
              </button>
              {shareToast && (
                <div
                  className="absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs pointer-events-none"
                  style={{ background: 'var(--color-peat-dark)', color: 'var(--color-text-light)', zIndex: 50 }}
                >
                  {shareToast === 'copied' ? 'Copied!' : 'Shared!'}
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-phase-menstrual)' }}>🍷</div>
          </div>
        </div>
        <WorldFilterToggle value={worldFilter} onChange={setWorldFilter} />
      </div>

      {/* Mood line */}
      <div className="px-5 py-2" style={{ borderBottom: '1px solid var(--color-peat-light)', background: phase !== 'unknown' ? style.fill : 'transparent' }}>
        <p className="text-xs italic" style={{ color: style.text }}>{mood}</p>
      </div>

      {/* Wine grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: 'var(--color-peat-light)' }}>
        {visibleItems.map(({ emoji, name, reason }) => (
          <div key={name} className="px-4 py-2.5" style={{ background: '#FFFFFF' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm leading-none">{emoji}</span>
              <span className="text-xs font-medium" style={{ color: labelColor }}>{name}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>{reason}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
          For enjoyment — drink responsibly and adjust to your own tolerance.
        </p>
      </div>
    </div>
  );
}
