import { useState } from 'react';
import { subDays, toISODate, differenceInDays, parseISO } from '../../lib/dateUtils';
import type { SymptomLog, Cycle, BowelMovement } from '../../types';

type Range = '7d' | '30d' | '90d' | '12m' | '1y';
type Phase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '7d',  label: '7d'  },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '12m', label: 'LTM' },
  { value: '1y',  label: 'YTD' },
];

const BM_TYPES: BowelMovement[] = ['normal', 'constipated', 'loose', 'diarrhea'];
const PHASES: Phase[] = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'];

const BM_COLORS: Record<BowelMovement, string> = {
  normal:      '#6B9E63',
  constipated: '#C4924A',
  loose:       '#7A6AB8',
  diarrhea:    '#B85858',
};

const BM_LABELS: Record<BowelMovement, string> = {
  normal:      'Normal',
  constipated: 'Constipated',
  loose:       'Loose',
  diarrhea:    'Diarrhea',
};

const PHASE_BG: Record<Phase, string> = {
  Menstrual:  'var(--color-phase-menstrual)',
  Follicular: 'var(--color-phase-follicular)',
  Ovulatory:  'var(--color-phase-ovulation)',
  Luteal:     'var(--color-phase-luteal)',
};

// ── Data helpers ──────────────────────────────────────────────────────────────

function filterByRange(symptoms: SymptomLog[], range: Range): SymptomLog[] {
  const today = new Date();
  const todayISO = toISODate(today);
  if (range === '7d')  return symptoms.filter(s => s.log_date >= toISODate(subDays(today, 6)));
  if (range === '30d') return symptoms.filter(s => s.log_date >= toISODate(subDays(today, 29)));
  if (range === '90d') return symptoms.filter(s => s.log_date >= toISODate(subDays(today, 89)));
  if (range === '12m') {
    const cutoff = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    return symptoms.filter(s => s.log_date >= toISODate(cutoff));
  }
  const yearStart = `${today.getFullYear()}-01-01`;
  return symptoms.filter(s => s.log_date >= yearStart && s.log_date <= todayISO);
}

function getPhaseForDate(logDate: string, cycles: Cycle[], avgLen: number, avgDur: number): Phase | null {
  const past = cycles.filter(c => c.start_date <= logDate);
  if (past.length === 0) return null;
  const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  const day = differenceInDays(parseISO(logDate), parseISO(latest.start_date)) + 1;
  if (day < 1 || day > avgLen + 7) return null;
  if (day <= avgDur)      return 'Menstrual';
  if (day <= avgLen - 16) return 'Follicular';
  if (day <= avgLen - 11) return 'Ovulatory';
  if (day <= avgLen)      return 'Luteal';
  return null;
}

type HeatMatrix = Record<BowelMovement, Record<Phase, number>>;

function buildMatrix(symptoms: SymptomLog[], cycles: Cycle[], range: Range, avgLen: number, avgDur: number): HeatMatrix {
  const matrix: HeatMatrix = {
    normal:      { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0 },
    constipated: { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0 },
    loose:       { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0 },
    diarrhea:    { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0 },
  };
  const filtered = filterByRange(symptoms, range).filter(s => s.bowel_movement);
  for (const log of filtered) {
    const phase = getPhaseForDate(log.log_date, cycles, avgLen, avgDur);
    if (phase && log.bowel_movement) matrix[log.bowel_movement][phase]++;
  }
  return matrix;
}

// Scale opacity per-row so each BM type's max is always fully saturated
function rowMax(matrix: HeatMatrix, bm: BowelMovement): number {
  return Math.max(...PHASES.map(p => matrix[bm][p]));
}

function cellOpacity(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  // 0.18 minimum so even count=1 is clearly visible; scales to 1.0 at max
  return 0.18 + 0.82 * (count / max);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  symptoms: SymptomLog[];
  cycles: Cycle[];
  avgCycleLength: number;
  avgPeriodDuration: number;
}

export function BowelMovementChart({ symptoms, cycles, avgCycleLength, avgPeriodDuration }: Props) {
  const [range, setRange] = useState<Range>('30d');
  const [hovered, setHovered] = useState<{ bm: BowelMovement; phase: Phase } | null>(null);

  const matrix = buildMatrix(symptoms, cycles, range, avgCycleLength, avgPeriodDuration);
  const hasAny = BM_TYPES.some(bm => PHASES.some(p => matrix[bm][p] > 0));

  const hoveredCount = hovered ? matrix[hovered.bm][hovered.phase] : null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-peat-deep)' }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: '1px solid var(--color-peat-light)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Bowel movement by cycle phase</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>Frequency across your cycle · darker = more frequent</p>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={range === value
                ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="px-4 pt-4 pb-2">
        {!hasAny ? (
          <div className="h-36 flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No bowel movement data logged in this period</p>
          </div>
        ) : (
          <div>
            {/* Column headers (phases) */}
            <div className="grid mb-2" style={{ gridTemplateColumns: '88px repeat(4, 1fr)', gap: '4px' }}>
              <div /> {/* empty corner */}
              {PHASES.map(phase => (
                <div
                  key={phase}
                  className="text-center py-1 rounded-lg text-xs font-medium"
                  style={{ background: PHASE_BG[phase], color: 'var(--color-peat-deep)', fontSize: '10px' }}
                >
                  {phase}
                </div>
              ))}
            </div>

            {/* Rows (BM types × phase cells) */}
            <div className="space-y-1">
              {BM_TYPES.map(bm => {
                const max = rowMax(matrix, bm);
                const color = BM_COLORS[bm];
                return (
                  <div key={bm} className="grid items-center" style={{ gridTemplateColumns: '88px repeat(4, 1fr)', gap: '4px' }}>
                    {/* Row label */}
                    <div className="flex items-center gap-1.5 pr-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-xs" style={{ color: 'var(--color-peat-deep)', fontSize: '11px' }}>
                        {BM_LABELS[bm]}
                      </span>
                    </div>

                    {/* Cells */}
                    {PHASES.map(phase => {
                      const count = matrix[bm][phase];
                      const opacity = cellOpacity(count, max);
                      const isHovered = hovered?.bm === bm && hovered?.phase === phase;
                      return (
                        <div
                          key={phase}
                          className="rounded-lg flex items-center justify-center transition-all"
                          style={{
                            height: '40px',
                            background: count > 0
                              ? `rgba(${hexToRgb(color)}, ${opacity})`
                              : 'var(--color-peat-light)',
                            border: isHovered
                              ? `2px solid ${color}`
                              : `2px solid ${count > 0 ? `rgba(${hexToRgb(color)}, ${Math.min(opacity + 0.2, 1)})` : 'var(--color-peat-light)'}`,
                            cursor: count > 0 ? 'default' : 'default',
                          }}
                          onMouseEnter={() => setHovered({ bm, phase })}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color: count > 0
                                ? opacity > 0.55 ? '#fff' : color
                                : 'var(--color-peat-mid)',
                              fontSize: '11px',
                            }}
                          >
                            {count > 0 ? count : '–'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Hover tooltip row */}
            <div className="mt-3 h-6 flex items-center justify-center">
              {hovered && hoveredCount !== null && hoveredCount > 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
                  <span className="font-medium">{BM_LABELS[hovered.bm]}</span>
                  {' logged '}
                  <span className="font-medium">{hoveredCount}×</span>
                  {' during '}
                  <span className="font-medium">{hovered.phase}</span>
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>Hover a cell to see details</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: '#A8C5A0' → '168, 197, 160'
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
