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
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';

function getPhase(cycleDay: number, avgCycleLength: number, avgPeriodDuration: number): Phase {
  if (cycleDay <= avgPeriodDuration)   return 'menstrual';
  if (cycleDay <= avgCycleLength - 16) return 'follicular';
  if (cycleDay <= avgCycleLength - 11) return 'ovulatory';
  if (cycleDay <= avgCycleLength)      return 'luteal';
  return 'unknown';
}

function getCurrentPhase(cycles: Cycle[], prediction: Prediction | null, avgCycleLength: number, avgPeriodDuration: number): Phase {
  const todayISO = todayLocalISO();
  const past = cycles.filter(c => c.start_date <= todayISO);
  if (past.length > 0) {
    const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const day = differenceInDays(startOfToday(), parseLocalDate(latest.start_date)) + 1;
    if (day >= 1) return getPhase(day, avgCycleLength, avgPeriodDuration);
  }
  if (prediction) {
    const daysUntil = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (daysUntil >= 0) return getPhase(Math.max(1, avgCycleLength - daysUntil), avgCycleLength, avgPeriodDuration);
  }
  return 'unknown';
}

// 0 = no pairing, 1 = pairing, 2 = perfect pairing
type Level = 0 | 1 | 2;

interface WineCol { label: string; color: string; textColor: string }
interface FoodRow  { emoji: string; label: string; pairings: Level[] }

const WINES: WineCol[] = [
  { label: 'Bold Red',    color: '#6B2737', textColor: '#fff' },
  { label: 'Med Red',     color: '#B03A2E', textColor: '#fff' },
  { label: 'Light Red',   color: '#D98880', textColor: '#fff' },
  { label: 'Rosé',        color: '#F1948A', textColor: '#7B241C' },
  { label: 'Rich White',  color: '#C9A84C', textColor: '#fff' },
  { label: 'Light White', color: '#C7A620', textColor: '#fff' },
  { label: 'Sparkling',   color: '#5DADE2', textColor: '#fff' },
  { label: 'Sweet',       color: '#D35400', textColor: '#fff' },
];

// Row index → food; column index → wine (matches WINES order above)
const FOODS: FoodRow[] = [
  { emoji: '🥩', label: 'Red Meat',        pairings: [2, 2, 1, 0, 0, 0, 0, 0] },
  { emoji: '🥓', label: 'Cured Meat',      pairings: [2, 2, 1, 1, 0, 0, 1, 0] },
  { emoji: '🍗', label: 'Poultry',         pairings: [0, 1, 2, 2, 2, 1, 1, 0] },
  { emoji: '🐟', label: 'Fish',            pairings: [0, 0, 0, 2, 1, 2, 2, 0] },
  { emoji: '🦐', label: 'Shellfish',       pairings: [0, 0, 0, 2, 2, 2, 2, 0] },
  { emoji: '🧀', label: 'Soft Cheese',     pairings: [0, 1, 2, 2, 2, 2, 2, 1] },
  { emoji: '🫙', label: 'Pungent Cheese',  pairings: [2, 1, 1, 0, 2, 0, 0, 2] },
  { emoji: '🥦', label: 'Vegetables',      pairings: [0, 1, 2, 2, 1, 2, 1, 0] },
  { emoji: '🍄', label: 'Mushrooms',       pairings: [2, 2, 2, 1, 1, 0, 0, 0] },
  { emoji: '🌶️', label: 'Spicy',           pairings: [0, 0, 1, 2, 0, 2, 2, 2] },
  { emoji: '🌿', label: 'Herbs',           pairings: [0, 1, 1, 2, 1, 2, 1, 0] },
  { emoji: '🍞', label: 'Starches',        pairings: [1, 2, 1, 2, 2, 2, 2, 0] },
  { emoji: '🍓', label: 'Fruit & Berries', pairings: [0, 0, 0, 1, 0, 1, 2, 2] },
  { emoji: '🍫', label: 'Chocolate',       pairings: [0, 0, 0, 0, 0, 0, 1, 2] },
];

// Wine column indices recommended per phase (matching WINES array)
const PHASE_WINES: Record<Phase, number[]> = {
  menstrual:  [0, 1, 2],       // Bold Red, Med Red, Light Red
  follicular: [2, 5, 6],       // Light Red, Light White, Sparkling
  ovulatory:  [0, 1, 3, 4, 6], // Bold Red, Med Red, Rosé, Rich White, Sparkling
  luteal:     [1, 2, 5],       // Med Red, Light Red, Light White
  unknown:    [],
};

// Food row indices recommended per phase (matching FOODS array)
const PHASE_FOODS: Record<Phase, number[]> = {
  menstrual:  [0, 3, 7, 10, 12, 13], // Red Meat, Fish, Vegetables, Herbs, Fruit, Chocolate
  follicular: [7, 11, 12],            // Vegetables, Starches, Fruit & Berries
  ovulatory:  [3, 4, 7, 12],          // Fish, Shellfish, Vegetables, Fruit
  luteal:     [2, 7, 10, 11, 12],     // Poultry, Vegetables, Herbs, Starches, Fruit
  unknown:    [],
};

const PHASE_META: Record<Phase, { label: string; color: string; text: string }> = {
  menstrual:  { label: 'Menstrual',  color: 'var(--color-phase-menstrual)',  text: 'var(--color-text-primary)' },
  follicular: { label: 'Follicular', color: 'var(--color-phase-follicular)', text: 'var(--color-blue-dark)'   },
  ovulatory:  { label: 'Ovulatory',  color: 'var(--color-phase-ovulation)',  text: 'var(--color-moss-dark)'   },
  luteal:     { label: 'Luteal',     color: 'var(--color-phase-luteal)',     text: 'var(--color-peat-deep)'   },
  unknown:    { label: '',           color: 'transparent',                   text: 'var(--color-peat-deep)'   },
};

function Dot({ level, wineColor, highlight }: { level: Level; wineColor: string; highlight: boolean }) {
  if (level === 0) return <span style={{ display: 'block', width: 10, height: 10 }} />;
  const size   = level === 2 ? 10 : 7;
  const opacity = highlight ? 1 : (level === 2 ? 0.35 : 0.2);
  return (
    <span style={{
      display: 'block', width: size, height: size, borderRadius: '50%',
      background: wineColor, opacity, margin: 'auto',
    }} />
  );
}

const NAVIGABLE_PHASES: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

export function WineFoodPairingCard({ cycles, prediction }: Props) {
  const avgCycleLength    = prediction?.avgCycleLength    ?? 28;
  const avgPeriodDuration = prediction?.avgPeriodDuration ?? 5;
  const todayPhase = getCurrentPhase(cycles, prediction, avgCycleLength, avgPeriodDuration);
  const canNavigate = todayPhase !== 'unknown';

  const [viewPhase, setViewPhase] = useState<Phase | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [shareToast, setShareToast] = useState<'copied' | 'shared' | null>(null);

  const activePhase = viewPhase ?? todayPhase;
  const isToday     = viewPhase === null || viewPhase === todayPhase;
  const hasPhase    = activePhase !== 'unknown';
  const meta        = PHASE_META[activePhase];
  const phaseW      = new Set(PHASE_WINES[activePhase]);
  const phaseF      = new Set(PHASE_FOODS[activePhase]);

  const goToPhase = (direction: 1 | -1) => {
    const base = activePhase === 'unknown' ? 'menstrual' : activePhase;
    const idx  = NAVIGABLE_PHASES.indexOf(base);
    const next = NAVIGABLE_PHASES[(idx + direction + NAVIGABLE_PHASES.length) % NAVIGABLE_PHASES.length];
    setViewPhase(next === todayPhase ? null : next);
  };

  const labelColor = 'var(--color-text-primary)';

  const handleShare = async () => {
    const phaseText = hasPhase ? ` · ${meta.label} phase` : '';
    const header = `Food & Wine Pairings${phaseText}`;
    const intro = `Hello, I'd like to share some wine pairings with you.`;
    const wineNames  = [...phaseW].map(i => WINES[i].label).join(', ');
    const foodNames  = [...phaseF].map(i => FOODS[i].label).join(', ');
    const body = hasPhase
      ? `Wines for this phase: ${wineNames}\nFoods for this phase: ${foodNames}`
      : 'Log a period to get phase-personalised pairings.';
    const text = `${intro}\n\n${header}\n\n${body}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Food & Wine Pairings', text });
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

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-3 pb-2.5 flex flex-col gap-2 shrink-0"
        style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: labelColor }}>Food & wine pairings</p>
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
            {hasPhase && (
              <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: meta.color, color: meta.text }}>
                {meta.label}
              </span>
            )}
            {canNavigate && (
              <div className="flex items-center gap-0.5">
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
            <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-phase-menstrual)' }}>🍽️</div>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
          {hasPhase ? 'Highlighted for your phase · large dot = perfect match' : 'Log a period to personalise · large dot = perfect match'}
        </p>
      </div>

      {/* Phase picks summary */}
      {hasPhase && (
        <div className="px-5 py-3 space-y-2" style={{ borderBottom: '1px solid var(--color-peat-light)', background: `${meta.color}22` }}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium shrink-0" style={{ color: meta.text }}>🍷 Wines</span>
            {[...phaseW].map(wi => (
              <span key={wi} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: WINES[wi].color, color: WINES[wi].textColor }}>
                {WINES[wi].label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium shrink-0" style={{ color: meta.text }}>🍽️ Foods</span>
            {[...phaseF].map(fi => (
              <span key={fi} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }}>
                {FOODS[fi].emoji} {FOODS[fi].label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable matrix */}
      <div className="overflow-x-auto" onMouseLeave={() => { setHoveredRow(null); setHoveredCol(null); }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 500, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: 136, minWidth: 136 }} />
              {WINES.map((w, wi) => {
                const isPhaseWine  = phaseW.has(wi);
                const isHoveredCol = hoveredCol === wi;
                return (
                  <th
                    key={wi}
                    onMouseEnter={() => setHoveredCol(wi)}
                    style={{
                      width: 48, minWidth: 48, padding: '4px 3px', textAlign: 'center',
                      verticalAlign: 'bottom', borderBottom: '1px solid var(--color-peat-light)',
                      background: isHoveredCol ? `${w.color}18` : undefined,
                      cursor: 'default', transition: 'background 0.1s',
                    }}
                  >
                    <div style={{
                      display: 'inline-block', background: w.color, color: w.textColor,
                      fontSize: 9, fontWeight: 400, lineHeight: 1.3, padding: '8px 5px',
                      borderRadius: 4, whiteSpace: 'nowrap', writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)', height: 84,
                      opacity: hasPhase && !isPhaseWine && hoveredCol === null ? 0.3 : 1,
                      transition: 'opacity 0.15s',
                      outline: isPhaseWine && hasPhase ? `2px solid ${w.color}` : undefined,
                      outlineOffset: 2,
                      boxShadow: isPhaseWine && hasPhase ? `0 2px 8px ${w.color}55` : undefined,
                    }}>
                      {w.label}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {FOODS.map((food, fi) => {
              const isPhaseFood  = phaseF.has(fi);
              const isHoveredRow = hoveredRow === fi;
              const rowBg = fi % 2 === 0 ? '#FFFFFF' : 'var(--color-peat-light)';
              return (
                <tr
                  key={fi}
                  onMouseEnter={() => setHoveredRow(fi)}
                  style={{ background: isHoveredRow ? 'var(--color-peat-mid)' : rowBg, transition: 'background 0.1s' }}
                >
                  <td style={{
                    padding: '4px 8px 4px 10px', fontSize: 11,
                    color: hasPhase && !isPhaseFood && hoveredRow === null ? 'var(--color-peat-mid)' : 'var(--color-peat-deep)',
                    overflow: 'hidden',
                    borderBottom: '1px solid var(--color-peat-light)',
                    borderLeft: isPhaseFood && hasPhase ? `3px solid ${meta.color === 'transparent' ? 'var(--color-peat-mid)' : meta.color}` : '3px solid transparent',
                    fontWeight: (isPhaseFood && hasPhase) || isHoveredRow ? 600 : 400,
                    transition: 'color 0.15s',
                  }}>
                    <span style={{ marginRight: 5, opacity: hasPhase && !isPhaseFood && hoveredRow === null ? 0.4 : 1 }}>{food.emoji}</span>
                    {food.label}
                  </td>
                  {food.pairings.map((level, wi) => {
                    const isPhaseWine  = phaseW.has(wi);
                    const isHighlight  = isPhaseFood && isPhaseWine && hasPhase;
                    const isHoveredCol = hoveredCol === wi;
                    const isIntersect  = isHoveredRow && isHoveredCol;

                    let cellBg: string | undefined;
                    if (isIntersect)       cellBg = `${WINES[wi].color}30`;
                    else if (isHoveredRow) cellBg = 'var(--color-peat-mid)';
                    else if (isHoveredCol) cellBg = `${WINES[wi].color}18`;
                    else if (isHighlight)  cellBg = `${meta.color}22`;

                    const dotHighlight = !hasPhase || isHighlight || isHoveredRow || isHoveredCol;

                    return (
                      <td key={wi} style={{
                        textAlign: 'center', padding: '4px 2px',
                        borderBottom: '1px solid var(--color-peat-light)',
                        borderLeft: wi === 0 ? '1px solid var(--color-peat-light)' : undefined,
                        background: cellBg,
                        transition: 'background 0.1s',
                      }}>
                        <Dot level={level} wineColor={WINES[wi].color} highlight={dotHighlight} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer legend */}
      <div className="px-4 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        {WINES.map((w, i) => (
          <div key={i} className="flex items-center gap-1">
            <span style={{ display: 'block', width: 7, height: 7, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: 'var(--color-peat-deep)', whiteSpace: 'nowrap' }}>{w.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
