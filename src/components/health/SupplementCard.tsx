import { useState } from 'react';
import type { Cycle, Prediction } from '../../types';
import { differenceInDays, parseLocalDate, startOfToday, todayLocalISO } from '../../lib/dateUtils';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
type SupType = 'mineral' | 'vitamin' | 'omega' | 'herb' | 'probiotic';

interface Supplement {
  emoji: string;
  name: string;
  dose: string;
  reason: string;
  type: SupType;
}

const PHASE_ORDER: Exclude<Phase, 'unknown'>[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

const SUPPLEMENTS: Record<Exclude<Phase, 'unknown'>, { headline: string; sub: string; items: Supplement[] }> = {
  menstrual: {
    headline: 'Replenish & restore',
    sub: 'Support your body through blood loss and inflammation',
    items: [
      { emoji: '🩸', name: 'Iron',        dose: '18 mg daily with vitamin C',    reason: 'Replenishes iron lost during menstrual bleeding and combats fatigue',    type: 'mineral' },
      { emoji: '⚡', name: 'Magnesium',   dose: '300–400 mg before bed',          reason: 'Relaxes uterine muscles, eases cramps, and improves sleep quality',      type: 'mineral' },
      { emoji: '🐟', name: 'Omega-3',     dose: '1–2 g daily with food',          reason: 'Reduces prostaglandins that drive cramping and inflammation',              type: 'omega'   },
      { emoji: '☀️', name: 'Vitamin D',   dose: '1,000–2,000 IU daily',           reason: 'Supports mood and immune function, often depleted during menstruation',    type: 'vitamin' },
      { emoji: '🔋', name: 'Vitamin B12', dose: '500–1,000 mcg daily',            reason: 'Helps sustain energy levels and red blood cell production',                type: 'vitamin' },
    ],
  },
  follicular: {
    headline: 'Build & energise',
    sub: 'Fuel rising oestrogen and follicle development',
    items: [
      { emoji: '🌿', name: 'B-Complex',  dose: '1 capsule daily with food',      reason: 'Supports oestrogen metabolism and sustained energy production',            type: 'vitamin'   },
      { emoji: '🦠', name: 'Probiotics', dose: '10–20 billion CFU daily',        reason: 'Promotes healthy oestrobolome for balanced oestrogen clearance',            type: 'probiotic' },
      { emoji: '🔬', name: 'Zinc',       dose: '8–15 mg daily',                  reason: 'Essential for follicle maturation and immune resilience',                   type: 'mineral'   },
      { emoji: '🍊', name: 'Vitamin C',  dose: '500–1,000 mg daily',             reason: 'Enhances iron absorption and provides antioxidant protection',               type: 'vitamin'   },
      { emoji: '⚙️', name: 'CoQ10',      dose: '100–200 mg daily with fat',      reason: 'Powers mitochondria in developing follicles and boosts energy',              type: 'vitamin'   },
    ],
  },
  ovulatory: {
    headline: 'Peak support',
    sub: 'Protect the egg and sustain peak hormone output',
    items: [
      { emoji: '🥚', name: 'Folate',    dose: '400–800 mcg daily',              reason: 'Critical for cell division and DNA integrity around ovulation',              type: 'vitamin' },
      { emoji: '🫐', name: 'Vitamin E', dose: '200–400 IU daily with food',     reason: 'Antioxidant shield for the maturing egg and follicle environment',           type: 'vitamin' },
      { emoji: '🔬', name: 'Selenium',  dose: '55–200 mcg daily',               reason: 'Supports follicle rupture and protects egg from oxidative stress',           type: 'mineral' },
      { emoji: '⚙️', name: 'CoQ10',     dose: '200–600 mg daily with fat',      reason: 'Maximises mitochondrial energy in the egg during peak fertility',            type: 'vitamin' },
      { emoji: '🐟', name: 'Omega-3',   dose: '1–2 g daily with food',          reason: 'Anti-inflammatory support during the ovulation inflammatory response',       type: 'omega'   },
    ],
  },
  luteal: {
    headline: 'Balance & calm',
    sub: 'Ease PMS and support progesterone',
    items: [
      { emoji: '⚡', name: 'Magnesium',          dose: '300–400 mg daily, evening',    reason: 'Reduces bloating, mood swings, headaches, and insomnia in the luteal phase', type: 'mineral' },
      { emoji: '🌿', name: 'Vitamin B6',          dose: '25–100 mg daily with food',    reason: 'Supports progesterone production and alleviates PMS symptoms',               type: 'vitamin' },
      { emoji: '🌸', name: 'Evening Primrose',    dose: '500–1,500 mg daily',           reason: 'GLA fatty acids reduce breast tenderness and PMS-related inflammation',       type: 'omega'   },
      { emoji: '🪨', name: 'Calcium',             dose: '600–1,200 mg daily',           reason: 'Clinical studies show calcium reduces PMS mood and physical symptoms',        type: 'mineral' },
      { emoji: '🌱', name: 'Vitex',               dose: '20–40 mg standardised daily',  reason: 'Supports LH surge balance and progesterone levels in the second half of cycle', type: 'herb'  },
    ],
  },
};

const TYPE_LABELS: Record<SupType, string> = {
  mineral:   'Mineral',
  vitamin:   'Vitamin',
  omega:     'Omega / Oil',
  herb:      'Herb',
  probiotic: 'Probiotic',
};

const DISCLAIMER = 'Always consult a healthcare professional before starting or changing supplements.';

// ── SVG wheel constants ────────────────────────────────────────────────────────
const CX = 160, CY = 160;
const R_OUTER     = 150;  // outer edge
const R_EMOJI_MID = 137;  // emoji center
const R_EMOJ_O    = 148;  // emoji ring outer
const R_EMOJ_I    = 124;  // emoji ring inner
const R_NAME_O    = 120;  // name ring outer
const R_NAME_I    = 76;   // name ring inner
const R_PHS_O     = 72;   // phase ring outer
const R_PHS_I     = 50;   // phase ring inner
const R_PHS_LBL   = 61;   // phase label arc radius
const R_CENTER    = 46;   // center circle radius
const SEG_DEG     = 18;   // 360 / 20 supplements
const GAP         = 1.2;  // degrees gap on each side of segment

// Phase colours (hex, matching tokens.css)
const PHASE_COLOR: Record<Exclude<Phase, 'unknown'>, { fill: string; light: string }> = {
  menstrual:  { fill: '#786B64', light: '#E8E4DC' },
  follicular: { fill: '#4A7FD4', light: '#C8DAF5' },
  ovulatory:  { fill: '#9E9A3C', light: '#DCF0B8' },
  luteal:     { fill: '#C9A0C2', light: '#EDD9EA' },
};

// Supplement type colours
const TYPE_COLOR: Record<SupType, string> = {
  mineral:   '#B8AF9E',
  vitamin:   '#8AAEE0',
  omega:     '#B8D878',
  herb:      '#C4C170',
  probiotic: '#D4A8D0',
};

// ── SVG helpers ───────────────────────────────────────────────────────────────
function pt(r: number, deg: number): [number, number] {
  // 0° = top, increasing clockwise
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function ptStr(r: number, deg: number, decimals = 2): string {
  const [x, y] = pt(r, deg);
  return `${x.toFixed(decimals)},${y.toFixed(decimals)}`;
}

function arcPath(ri: number, ro: number, startDeg: number, endDeg: number, gap = GAP): string {
  const s = startDeg + gap, e = endDeg - gap;
  const [x1, y1] = pt(ro, s); const [x2, y2] = pt(ro, e);
  const [x3, y3] = pt(ri, e); const [x4, y4] = pt(ri, s);
  const lg = (e - s) > 180 ? 1 : 0;
  return `M${x1.toFixed(2)},${y1.toFixed(2)}A${ro},${ro},0,${lg},1,${x2.toFixed(2)},${y2.toFixed(2)}L${x3.toFixed(2)},${y3.toFixed(2)}A${ri},${ri},0,${lg},0,${x4.toFixed(2)},${y4.toFixed(2)}Z`;
}

// Phase label arcs: clockwise through each 90° quadrant with 4° insets.
// For bottom quadrants the path is reversed (end→start) so SVG sweep=1 gives
// correct on-screen direction and text reads correctly.
const PHASE_TEXT_ARC: Record<Exclude<Phase, 'unknown'>, string> = {
  menstrual:  `M${ptStr(R_PHS_LBL,  4)} A${R_PHS_LBL},${R_PHS_LBL},0,0,1,${ptStr(R_PHS_LBL,  86)}`,
  follicular: `M${ptStr(R_PHS_LBL,176)} A${R_PHS_LBL},${R_PHS_LBL},0,0,1,${ptStr(R_PHS_LBL,  94)}`,
  ovulatory:  `M${ptStr(R_PHS_LBL,266)} A${R_PHS_LBL},${R_PHS_LBL},0,0,1,${ptStr(R_PHS_LBL, 184)}`,
  luteal:     `M${ptStr(R_PHS_LBL,274)} A${R_PHS_LBL},${R_PHS_LBL},0,0,1,${ptStr(R_PHS_LBL, 356)}`,
};

const PHASE_LABEL: Record<Exclude<Phase, 'unknown'>, string> = {
  menstrual:  'MENSTRUAL',
  follicular: 'FOLLICULAR',
  ovulatory:  'OVULATORY',
  luteal:     'LUTEAL',
};

// ── Flat supplement list (wheel order) ────────────────────────────────────────
const FLAT_SUPS: { phase: Exclude<Phase, 'unknown'>; item: Supplement }[] =
  PHASE_ORDER.flatMap(phase => SUPPLEMENTS[phase].items.map(item => ({ phase, item })));

// ── Cycle helpers ─────────────────────────────────────────────────────────────
function getPhase(cycleDay: number, avgLen: number, avgDur: number): Phase {
  if (cycleDay <= avgDur)      return 'menstrual';
  if (cycleDay <= avgLen - 16) return 'follicular';
  if (cycleDay <= avgLen - 11) return 'ovulatory';
  if (cycleDay <= avgLen)      return 'luteal';
  return 'unknown';
}

function getCurrentCycleDay(cycles: Cycle[], prediction: Prediction | null): number | null {
  const todayISO = todayLocalISO();
  const past = cycles.filter(c => c.start_date <= todayISO);
  if (past.length > 0) {
    const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const day = differenceInDays(startOfToday(), parseLocalDate(latest.start_date)) + 1;
    return day >= 1 ? day : null;
  }
  if (prediction) {
    const daysUntil = differenceInDays(prediction.nextPeriodStart, startOfToday());
    if (daysUntil >= 0) return Math.max(1, prediction.avgCycleLength - daysUntil);
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SupplementCard({ cycles, prediction }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const cycleDay          = getCurrentCycleDay(cycles, prediction);
  const avgLen            = prediction?.avgCycleLength    ?? 28;
  const avgDur            = prediction?.avgPeriodDuration ?? 5;
  const todayPhase: Phase = cycleDay != null ? getPhase(cycleDay, avgLen, avgDur) : 'unknown';

  const activePhase: Exclude<Phase, 'unknown'> =
    (selected !== null ? FLAT_SUPS[selected].phase : null)
    ?? (todayPhase !== 'unknown' ? todayPhase : 'menstrual');

  const selectedSup = selected !== null ? FLAT_SUPS[selected] : null;

  const handleSeg = (i: number) =>
    setSelected(prev => (prev === i ? null : i));

  const handlePhaseRing = (phase: Exclude<Phase, 'unknown'>) => {
    const firstIdx = PHASE_ORDER.indexOf(phase) * 5;
    setSelected(prev => (FLAT_SUPS[prev ?? -1]?.phase === phase ? null : firstIdx));
  };

  const pc = PHASE_COLOR[activePhase];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: `4px solid ${pc.fill}` }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ background: pc.light }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-peat-deep)' }}>
            Supplements
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {SUPPLEMENTS[activePhase].headline}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>
            {SUPPLEMENTS[activePhase].sub}
          </p>
        </div>
        <div className="text-2xl shrink-0 ml-3">💊</div>
      </div>

      {/* Wheel */}
      <div className="px-2 py-2">
        <svg viewBox="0 0 320 320" width="100%" style={{ display: 'block' }}>
          <defs>
            {PHASE_ORDER.map(phase => (
              <path key={phase} id={`tp-${phase}`} d={PHASE_TEXT_ARC[phase]} fill="none" />
            ))}
          </defs>

          {/* ── Phase ring arcs ── */}
          {PHASE_ORDER.map((phase, pi) => {
            const isActive = phase === activePhase;
            return (
              <path
                key={`ph-${phase}`}
                d={arcPath(R_PHS_I, R_PHS_O, pi * 90, (pi + 1) * 90, 2)}
                fill={PHASE_COLOR[phase].fill}
                opacity={isActive ? 1 : 0.38}
                style={{ cursor: 'pointer' }}
                onClick={() => handlePhaseRing(phase)}
              />
            );
          })}

          {/* ── Phase labels (textPath) ── */}
          {PHASE_ORDER.map(phase => (
            <text key={`lbl-${phase}`} fontSize="6.2" fontWeight="700" fill="white" letterSpacing="0.6">
              <textPath href={`#tp-${phase}`} startOffset="50%" textAnchor="middle">
                {PHASE_LABEL[phase]}
              </textPath>
            </text>
          ))}

          {/* ── Today phase dot ── */}
          {todayPhase !== 'unknown' && (() => {
            const pi = PHASE_ORDER.indexOf(todayPhase as Exclude<Phase,'unknown'>);
            const [dx, dy] = pt(R_PHS_O + 5, pi * 90 + 45);
            return <circle cx={dx} cy={dy} r="3.5" fill={PHASE_COLOR[todayPhase as Exclude<Phase,'unknown'>].fill} stroke="white" strokeWidth="1.2" />;
          })()}

          {/* ── Supplement segments ── */}
          {FLAT_SUPS.map(({ phase, item }, i) => {
            const startDeg = i * SEG_DEG;
            const endDeg   = startDeg + SEG_DEG;
            const midDeg   = startDeg + SEG_DEG / 2;
            const isSel    = selected === i;
            const isAct    = phase === activePhase;
            const opacity  = isSel ? 1 : isAct ? 0.82 : 0.3;
            const [ex, ey] = pt(R_EMOJI_MID, midDeg);

            return (
              <g key={i} style={{ cursor: 'pointer' }} onClick={() => handleSeg(i)}>
                {/* Type-coloured name ring */}
                <path
                  d={arcPath(R_NAME_I, R_NAME_O, startDeg, endDeg)}
                  fill={TYPE_COLOR[item.type]}
                  opacity={opacity}
                />
                {/* Phase-light emoji ring */}
                <path
                  d={arcPath(R_EMOJ_I, R_EMOJ_O, startDeg, endDeg)}
                  fill={PHASE_COLOR[phase].light}
                  opacity={isSel ? 1 : isAct ? 0.88 : 0.32}
                />
                {/* Selected highlight ring */}
                {isSel && (
                  <path
                    d={arcPath(R_EMOJ_I, R_OUTER, startDeg, endDeg, GAP * 0.5)}
                    fill="none"
                    stroke={PHASE_COLOR[phase].fill}
                    strokeWidth="2"
                  />
                )}
                {/* Emoji */}
                <text x={ex} y={ey} textAnchor="middle" dominantBaseline="middle" fontSize="12">
                  {item.emoji}
                </text>
              </g>
            );
          })}

          {/* ── Centre circle ── */}
          <circle
            cx={CX} cy={CY} r={R_CENTER}
            fill={selectedSup ? PHASE_COLOR[selectedSup.phase].light : '#F0EDE6'}
            style={{ cursor: selectedSup ? 'pointer' : 'default' }}
            onClick={() => setSelected(null)}
          />

          {selectedSup ? (
            <>
              <text x={CX} y={CY - 9} textAnchor="middle" dominantBaseline="middle" fontSize="18">
                {selectedSup.item.emoji}
              </text>
              <text x={CX} y={CY + 13} textAnchor="middle" fontSize="7" fontWeight="700" fill="#3A3812">
                {selectedSup.item.name.length > 9
                  ? selectedSup.item.name.slice(0, 8) + '…'
                  : selectedSup.item.name}
              </text>
            </>
          ) : (
            <>
              <text x={CX} y={CY - 7} textAnchor="middle" fontSize="6" fill="#786B64" letterSpacing="0.4">
                TAP TO EXPLORE
              </text>
              <text x={CX} y={CY + 7} textAnchor="middle" fontSize="8" fontWeight="700" fill="#3A3812">
                {SUPPLEMENTS[activePhase].headline.split(' ')[0]}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* ── Detail panel ── */}
      {selectedSup ? (
        <div
          className="mx-4 mb-4 rounded-xl p-4"
          style={{ background: PHASE_COLOR[selectedSup.phase].light }}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0">{selectedSup.item.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedSup.item.name}
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: TYPE_COLOR[selectedSup.item.type] + '55', color: 'var(--color-text-primary)' }}
                >
                  {TYPE_LABELS[selectedSup.item.type]}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: PHASE_COLOR[selectedSup.phase].fill + '22', color: PHASE_COLOR[selectedSup.phase].fill }}
                >
                  {selectedSup.phase}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Dose</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{ background: 'rgba(255,255,255,0.65)', color: 'var(--color-text-primary)' }}
                >
                  {selectedSup.item.dose}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-peat-deep)', fontWeight: 300 }}>
                {selectedSup.item.reason}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="mt-3 text-xs"
            style={{ color: 'var(--color-peat-deep)' }}
          >
            ← Back to wheel
          </button>
        </div>
      ) : (
        <div className="px-5 pb-4">
          <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
            Tap any segment to see dose &amp; details. Tap the inner ring to switch phases.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-5 py-3" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        <p className="text-xs italic" style={{ color: 'var(--color-peat-mid)' }}>{DISCLAIMER}</p>
      </div>
    </div>
  );
}
