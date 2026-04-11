import { useState, useRef } from 'react';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type Level = 0 | 1 | 2;

// ── Phase helpers ────────────────────────────────────────────────────────────
function getPhase(day: number, len: number, dur: number): Phase {
  if (day <= dur)    return 'menstrual';
  if (day <= len-16) return 'follicular';
  if (day <= len-11) return 'ovulatory';
  if (day <= len)    return 'luteal';
  return 'unknown';
}
function getCurrentPhase(cycles: Cycle[], prediction: Prediction | null, len: number, dur: number): Phase {
  const iso = todayLocalISO();
  const past = cycles.filter(c => c.start_date <= iso);
  if (past.length > 0) {
    const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const d = differenceInDays(startOfToday(), parseLocalDate(latest.start_date)) + 1;
    if (d >= 1) return getPhase(d, len, dur);
  }
  if (prediction) {
    const d = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (d >= 0) return getPhase(Math.max(1, len - d), len, dur);
  }
  return 'unknown';
}

// ── Wine & food data ─────────────────────────────────────────────────────────
const WINES = [
  { label: 'Bold Red',    color: '#6B2737' },
  { label: 'Med Red',     color: '#B03A2E' },
  { label: 'Light Red',   color: '#D98880' },
  { label: 'Rosé',        color: '#F1948A' },
  { label: 'Rich White',  color: '#C9A84C' },
  { label: 'Light White', color: '#C7A620' },
  { label: 'Sparkling',   color: '#5DADE2' },
  { label: 'Sweet',       color: '#D35400' },
];

const FOODS: { emoji: string; label: string; pairings: Level[] }[] = [
  { emoji: '🥩', label: 'Red Meat',       pairings: [2, 2, 1, 0, 0, 0, 0, 0] },
  { emoji: '🥓', label: 'Cured Meat',     pairings: [2, 2, 1, 1, 0, 0, 1, 0] },
  { emoji: '🍗', label: 'Poultry',        pairings: [0, 1, 2, 2, 2, 1, 1, 0] },
  { emoji: '🐟', label: 'Fish',           pairings: [0, 0, 0, 2, 1, 2, 2, 0] },
  { emoji: '🦐', label: 'Shellfish',      pairings: [0, 0, 0, 2, 2, 2, 2, 0] },
  { emoji: '🧀', label: 'Soft Cheese',    pairings: [0, 1, 2, 2, 2, 2, 2, 1] },
  { emoji: '🫙', label: 'Pungent Cheese', pairings: [2, 1, 1, 0, 2, 0, 0, 2] },
  { emoji: '🥦', label: 'Vegetables',     pairings: [0, 1, 2, 2, 1, 2, 1, 0] },
  { emoji: '🍄', label: 'Mushrooms',      pairings: [2, 2, 2, 1, 1, 0, 0, 0] },
  { emoji: '🌶️', label: 'Spicy',          pairings: [0, 0, 1, 2, 0, 2, 2, 2] },
  { emoji: '🌿', label: 'Herbs',          pairings: [0, 1, 1, 2, 1, 2, 1, 0] },
  { emoji: '🍞', label: 'Starches',       pairings: [1, 2, 1, 2, 2, 2, 2, 0] },
  { emoji: '🍓', label: 'Fruit',          pairings: [0, 0, 0, 1, 0, 1, 2, 2] },
  { emoji: '🍫', label: 'Chocolate',      pairings: [0, 0, 0, 0, 0, 0, 1, 2] },
];

// Ordered to flow: Protein → Cheese → Veg & Herbs → Carbs & Sweet
const FOOD_GROUPS = [
  { label: 'Protein',       color: '#7A3030', light: '#C4706A', foodIdxs: [0, 1, 2, 3, 4]    },
  { label: 'Cheese',        color: '#8A6A28', light: '#C9A864', foodIdxs: [5, 6]              },
  { label: 'Veg & Herbs',   color: '#3A6A3A', light: '#70A870', foodIdxs: [7, 8, 9, 10]      },
  { label: 'Carbs & Sweet', color: '#8A4A30', light: '#C08058', foodIdxs: [11, 12, 13]        },
];

const PHASE_WINES: Record<Phase, number[]> = {
  menstrual:  [0, 1, 2],
  follicular: [2, 5, 6],
  ovulatory:  [0, 1, 3, 4, 6],
  luteal:     [1, 2, 5],
  unknown:    [],
};
const PHASE_FOODS: Record<Phase, number[]> = {
  menstrual:  [0, 3, 7, 10, 12, 13],
  follicular: [7, 11, 12],
  ovulatory:  [3, 4, 7, 12],
  luteal:     [2, 7, 10, 11, 12],
  unknown:    [],
};
const PHASE_META: Record<Phase, { label: string; color: string; text: string }> = {
  menstrual:  { label: 'Menstrual',  color: 'var(--color-phase-menstrual)',  text: 'var(--color-text-primary)' },
  follicular: { label: 'Follicular', color: 'var(--color-phase-follicular)', text: 'var(--color-blue-dark)'   },
  ovulatory:  { label: 'Ovulatory',  color: 'var(--color-phase-ovulation)',  text: 'var(--color-moss-dark)'   },
  luteal:     { label: 'Luteal',     color: 'var(--color-phase-luteal)',     text: 'var(--color-peat-deep)'   },
  unknown:    { label: '',           color: 'transparent',                   text: 'var(--color-peat-deep)'   },
};
const NAVIGABLE: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

// ── SVG geometry ─────────────────────────────────────────────────────────────
const SIZE = 500;
const CX = 250, CY = 250;
const R_CENTER    = 48;
const R_GROUP_OUT = 100;
const R_FOOD_OUT  = 172;
const R_WINE_IN   = 175;
const R_WINE_OUT  = 224;

const N_FOODS    = FOODS.length;          // 14
const DEG_F      = 360 / N_FOODS;         // ≈25.71° per food
const FOOD_GAP   = 0.8;                   // gap between food slices
const WINE_GAP   = 0.15;                  // gap between wine sub-arcs

function p2c(r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function sector(r1: number, r2: number, a1: number, a2: number): string {
  const s1 = p2c(r1, a1), e1 = p2c(r1, a2);
  const s2 = p2c(r2, a1), e2 = p2c(r2, a2);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M${s1.x},${s1.y} A${r1},${r1} 0 ${lg} 1 ${e1.x},${e1.y} L${e2.x},${e2.y} A${r2},${r2} 0 ${lg} 0 ${s2.x},${s2.y} Z`;
}

// Unique arc id for textPath
let _id = 0;
function uid() { return `ww-${++_id}`; }

// ── Tooltip ──────────────────────────────────────────────────────────────────
interface TooltipState {
  foodIdx: number;
  x: number;
  y: number;
}

function WineTooltip({ foodIdx, phaseWines, phaseFood, meta, hasPhase }:
  { foodIdx: number; phaseWines: Set<number>; phaseFood: boolean; meta: { label: string; color: string; text: string }; hasPhase: boolean }) {
  const food = FOODS[foodIdx];
  const pairs = food.pairings
    .map((level, wi) => ({ wine: WINES[wi], level, wi }))
    .filter(p => p.level > 0)
    .sort((a, b) => {
      if (hasPhase) {
        const aP = phaseWines.has(a.wi), bP = phaseWines.has(b.wi);
        if (aP !== bP) return aP ? -1 : 1;
      }
      return b.level - a.level;
    });

  return (
    <div className="rounded-xl shadow-lg p-3 text-xs min-w-[160px]" style={{ background: '#fff', border: '1px solid var(--color-peat-mid)', pointerEvents: 'none' }}>
      <div className="flex items-center gap-1.5 mb-2 pb-2" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <span className="text-base leading-none">{food.emoji}</span>
        <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{food.label}</span>
        {phaseFood && hasPhase && (
          <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: meta.color, color: meta.text }}>
            {meta.label}
          </span>
        )}
      </div>
      {pairs.length === 0 ? (
        <p style={{ color: 'var(--color-peat-deep)' }}>No pairings found.</p>
      ) : pairs.map(({ wine, level, wi }) => (
        <div key={wi} className="flex items-center gap-1.5 mb-1">
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: wine.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--color-peat-deep)', flex: 1 }}>{wine.label}</span>
          <span style={{ color: phaseWines.has(wi) && hasPhase ? wine.color : 'var(--color-peat-mid)', fontWeight: 600 }}>
            {level === 2 ? '★★' : '★'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

export function WinePairingWheel({ cycles, prediction }: Props) {
  const avgLen = prediction?.avgCycleLength    ?? 28;
  const avgDur = prediction?.avgPeriodDuration ?? 5;
  const todayPhase = getCurrentPhase(cycles, prediction, avgLen, avgDur);
  const canNavigate = todayPhase !== 'unknown';

  const [viewPhase, setViewPhase] = useState<Phase | null>(null);
  const [tooltip, setTooltip]     = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const activePhase = viewPhase ?? todayPhase;
  const isToday     = viewPhase === null || viewPhase === todayPhase;
  const hasPhase    = activePhase !== 'unknown';
  const meta        = PHASE_META[activePhase];
  const phaseWines  = new Set(PHASE_WINES[activePhase]);
  const phaseFoods  = new Set(PHASE_FOODS[activePhase]);

  const goToPhase = (dir: 1 | -1) => {
    const base = activePhase === 'unknown' ? 'menstrual' : activePhase;
    const idx  = NAVIGABLE.indexOf(base);
    const next = NAVIGABLE[(idx + dir + NAVIGABLE.length) % NAVIGABLE.length];
    setViewPhase(next === todayPhase ? null : next);
  };

  // Build label arc paths for textPath (one per food)
  const labelArcs: string[] = FOODS.map((_, fi) => {
    const a1 = fi * DEG_F + FOOD_GAP;
    const a2 = (fi + 1) * DEG_F - FOOD_GAP;
    const mid = (a1 + a2) / 2;
    const labelR = (R_GROUP_OUT + R_FOOD_OUT) / 2 + 4; // slightly toward outer
    // For left half (mid > 180), reverse arc so text isn't upside-down
    if (mid > 180) {
      const s = p2c(labelR, a2), e = p2c(labelR, a1);
      return `M${s.x},${s.y} A${labelR},${labelR} 0 0 0 ${e.x},${e.y}`;
    }
    const s = p2c(labelR, a1), e = p2c(labelR, a2);
    return `M${s.x},${s.y} A${labelR},${labelR} 0 0 1 ${e.x},${e.y}`;
  });
  const labelIds = FOODS.map(() => uid());

  // Build group label arc paths
  const groupLabelArcs = FOOD_GROUPS.map(g => {
    const foods = g.foodIdxs;
    const a1 = foods[0] * DEG_F + FOOD_GAP;
    const a2 = (foods[foods.length - 1] + 1) * DEG_F - FOOD_GAP;
    const mid = (a1 + a2) / 2;
    const r = (R_CENTER + R_GROUP_OUT) / 2;
    if (mid > 180) {
      const s = p2c(r, a2), e = p2c(r, a1);
      return `M${s.x},${s.y} A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 0 ${e.x},${e.y}`;
    }
    const s = p2c(r, a1), e = p2c(r, a2);
    return `M${s.x},${s.y} A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${e.x},${e.y}`;
  });
  const groupLabelIds = FOOD_GROUPS.map(() => uid());

  const handleFoodEnter = (fi: number, e: React.MouseEvent<SVGPathElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({ foodIdx: fi, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleFoodMove = (e: React.MouseEvent) => {
    if (!svgRef.current || tooltip === null) return;
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip(t => t ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-3 pb-2.5 flex items-center justify-between gap-3 shrink-0"
        style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Food & wine pairings</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>
            {hasPhase ? 'Phase recommendations highlighted · hover for details' : 'Log a period to personalise · hover for details'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canNavigate && !isToday && (
            <button onClick={() => setViewPhase(null)} className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: 'var(--color-blue-base)', border: '1px solid var(--color-blue-mid)' }}>
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
              <button onClick={() => goToPhase(-1)} className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: 'var(--color-text-primary)' }}>‹</button>
              <button onClick={() => goToPhase(1)}  className="w-6 h-6 flex items-center justify-center rounded-md text-sm" style={{ color: 'var(--color-text-primary)' }}>›</button>
            </div>
          )}
          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-phase-menstrual)' }}>🍽️</div>
        </div>
      </div>

      {/* SVG wheel */}
      <div className="relative" onMouseLeave={() => setTooltip(null)}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width="100%"
          style={{ display: 'block' }}
          onMouseMove={handleFoodMove}
        >
          <defs>
            {/* TextPath arc definitions */}
            {labelIds.map((id, fi) => (
              <path key={id} id={id} d={labelArcs[fi]} fill="none" />
            ))}
            {groupLabelIds.map((id, gi) => (
              <path key={id} id={id} d={groupLabelArcs[gi]} fill="none" />
            ))}
          </defs>

          {/* ── Inner ring: food groups ── */}
          {FOOD_GROUPS.map((g, gi) => {
            const a1 = g.foodIdxs[0] * DEG_F + FOOD_GAP;
            const a2 = (g.foodIdxs[g.foodIdxs.length - 1] + 1) * DEG_F - FOOD_GAP;
            return (
              <g key={gi}>
                <path d={sector(R_CENTER, R_GROUP_OUT, a1, a2)} fill={g.color} stroke="#fff" strokeWidth={1.5} />
                <text fontSize={9} fontWeight={600} fill="#fff" letterSpacing={0.5}>
                  <textPath href={`#${groupLabelIds[gi]}`} startOffset="50%" textAnchor="middle">
                    {g.label.toUpperCase()}
                  </textPath>
                </text>
              </g>
            );
          })}

          {/* ── Middle ring: specific foods ── */}
          {FOODS.map((food, fi) => {
            const a1  = fi * DEG_F + FOOD_GAP;
            const a2  = (fi + 1) * DEG_F - FOOD_GAP;
            const mid = (a1 + a2) / 2;
            const grp = FOOD_GROUPS.find(g => g.foodIdxs.includes(fi))!;
            const isPhaseFood = phaseFoods.has(fi);
            const dim = hasPhase && !isPhaseFood;
            const emojiPos = p2c(R_FOOD_OUT - 13, mid);

            return (
              <g key={fi}>
                <path
                  d={sector(R_GROUP_OUT, R_FOOD_OUT, a1, a2)}
                  fill={grp.light}
                  stroke="#fff"
                  strokeWidth={1.5}
                  opacity={dim ? 0.35 : 1}
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => handleFoodEnter(fi, e)}
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* Emoji near outer edge of food ring */}
                <text
                  x={emojiPos.x}
                  y={emojiPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  opacity={dim ? 0.3 : 1}
                  style={{ pointerEvents: 'none', transition: 'opacity 0.15s' }}
                >
                  {food.emoji}
                </text>
                {/* Food label along arc */}
                <text
                  fontSize={8.5}
                  fill={dim ? '#aaa' : '#444'}
                  fontWeight={isPhaseFood && hasPhase ? 700 : 400}
                  style={{ pointerEvents: 'none', transition: 'fill 0.15s' }}
                >
                  <textPath href={`#${labelIds[fi]}`} startOffset="50%" textAnchor="middle">
                    {food.label}
                  </textPath>
                </text>
              </g>
            );
          })}

          {/* ── Outer ring: wine pairing bands ── */}
          {FOODS.map((food, fi) => {
            const foodA1  = fi * DEG_F + FOOD_GAP;
            const foodA2  = (fi + 1) * DEG_F - FOOD_GAP;
            const span    = foodA2 - foodA1;
            const slotW   = span / WINES.length;
            const isPhaseFood = phaseFoods.has(fi);

            return (
              <g key={fi}>
                {WINES.map((wine, wi) => {
                  const level = food.pairings[wi];
                  if (level === 0) return null;
                  const isPhaseWine = phaseWines.has(wi);
                  const highlight   = isPhaseFood && isPhaseWine && hasPhase;
                  const wA1 = foodA1 + wi * slotW + WINE_GAP;
                  const wA2 = foodA1 + (wi + 1) * slotW - WINE_GAP;

                  let opacity: number;
                  if (!hasPhase) {
                    opacity = level === 2 ? 0.9 : 0.45;
                  } else if (highlight) {
                    opacity = level === 2 ? 1 : 0.7;
                  } else if (isPhaseWine || isPhaseFood) {
                    opacity = level === 2 ? 0.55 : 0.3;
                  } else {
                    opacity = level === 2 ? 0.15 : 0.08;
                  }

                  return (
                    <path
                      key={wi}
                      d={sector(R_WINE_IN, R_WINE_OUT, wA1, wA2)}
                      fill={wine.color}
                      opacity={opacity}
                      stroke="#fff"
                      strokeWidth={0.5}
                      style={{ transition: 'opacity 0.15s', pointerEvents: 'none' }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* ── Center circle ── */}
          <circle cx={CX} cy={CY} r={R_CENTER} fill="#fff" stroke="var(--color-peat-light)" strokeWidth={1.5} />
          <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="middle" fontSize={22}>🍷</text>
          {hasPhase && (
            <text x={CX} y={CY + 14} textAnchor="middle" dominantBaseline="middle" fontSize={8}
              fill={meta.text === 'var(--color-text-primary)' ? '#2E2820' : '#4A6A8A'}
              fontWeight={600} letterSpacing={0.3}>
              {meta.label.toUpperCase()}
            </text>
          )}
        </svg>

        {/* Tooltip */}
        {tooltip !== null && (
          <div
            className="absolute z-10"
            style={{
              left: Math.min(tooltip.x + 12, SIZE - 180),
              top:  Math.max(tooltip.y - 60, 4),
              pointerEvents: 'none',
            }}
          >
            <WineTooltip
              foodIdx={tooltip.foodIdx}
              phaseWines={phaseWines}
              phaseFood={phaseFoods.has(tooltip.foodIdx)}
              meta={meta}
              hasPhase={hasPhase}
            />
          </div>
        )}
      </div>

      {/* Wine legend */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 shrink-0" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        {WINES.map((w, i) => (
          <div key={i} className="flex items-center gap-1">
            <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: w.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: 'var(--color-peat-deep)', whiteSpace: 'nowrap' }}>{w.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <span style={{ fontSize: 9, color: 'var(--color-peat-mid)' }}>★★ perfect · ★ good</span>
        </div>
      </div>
    </div>
  );
}
