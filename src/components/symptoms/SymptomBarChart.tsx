import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { subDays, toISODate, differenceInDays, parseLocalDate } from '../../lib/dateUtils';
import type { SymptomLog, Cycle, BowelMovement } from '../../types';

type Range = '7d' | '30d' | '90d' | '12m' | '1y';
type View  = 'symptoms' | 'other' | 'bowel';

interface Props {
  symptoms:          SymptomLog[];
  cycles?:           Cycle[];
  avgCycleLength?:   number;
  avgPeriodDuration?: number;
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '7d',  label: '7d'  },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '12m', label: 'LTM' },
  { value: '1y',  label: 'YTD' },
];

// ── Symptom tab ───────────────────────────────────────────────────────────────

const SYMPTOM_KEYS = [
  'cramps', 'bloating', 'headache', 'fatigue', 'breast_tenderness', 'spotting',
] as const;
type SymptomKey = typeof SYMPTOM_KEYS[number];

const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  cramps: 'Cramps', bloating: 'Bloating', headache: 'Headache',
  fatigue: 'Fatigue', breast_tenderness: 'Breast', spotting: 'Spotting',
};

const MILD_COLOR     = '#A8C5A0';
const MODERATE_COLOR = '#E8B87A';
const SEVERE_COLOR   = '#C47878';
const OTHER_COLOR    = '#A088C4';

// ── Bowel tab ─────────────────────────────────────────────────────────────────

const BM_TYPES: BowelMovement[] = ['normal', 'constipated', 'loose', 'diarrhea'];

const BM_COLORS: Record<BowelMovement, string> = {
  normal:      '#A8C5A0',
  constipated: '#E8C07A',
  loose:       '#A088C4',
  diarrhea:    '#C47878',
};

const BM_LABELS: Record<BowelMovement, string> = {
  normal: 'Normal', constipated: 'Constipated', loose: 'Loose', diarrhea: 'Diarrhea',
};

type BowelPhase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';
const BOWEL_PHASES: BowelPhase[] = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'];

const PHASE_BG: Record<BowelPhase, string> = {
  Menstrual:  'var(--color-phase-menstrual)',
  Follicular: 'var(--color-phase-follicular)',
  Ovulatory:  'var(--color-phase-ovulation)',
  Luteal:     'var(--color-phase-luteal)',
};

// ── Shared helpers ────────────────────────────────────────────────────────────

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

// ── Symptom chart data ────────────────────────────────────────────────────────

type ChartPoint = { symptom: string; key: SymptomKey; mild: number; moderate: number; severe: number; total: number };
type OtherPoint = { name: string; count: number };

function buildData(symptoms: SymptomLog[], range: Range): ChartPoint[] {
  const filtered = filterByRange(symptoms, range);
  return SYMPTOM_KEYS.map(k => {
    const mild     = filtered.filter(s => s[k] === 'mild').length;
    const moderate = filtered.filter(s => s[k] === 'moderate').length;
    const severe   = filtered.filter(s => s[k] === 'severe').length;
    return { symptom: SYMPTOM_LABELS[k], key: k, mild, moderate, severe, total: mild + moderate + severe };
  });
}

function buildOtherData(symptoms: SymptomLog[], range: Range): OtherPoint[] {
  const filtered = filterByRange(symptoms, range);
  const counts: Record<string, number> = {};
  for (const log of filtered) {
    for (const s of log.other_symptoms ?? []) {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));
}

// ── Bowel heatmap data ────────────────────────────────────────────────────────

type HeatMatrix = Record<BowelMovement, Record<BowelPhase, number>>;

function buildBowelMatrix(symptoms: SymptomLog[], cycles: Cycle[], range: Range, avgLen: number, avgDur: number): HeatMatrix {
  const matrix: HeatMatrix = {
    normal:      { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0 },
    constipated: { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0 },
    loose:       { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0 },
    diarrhea:    { Menstrual: 0, Follicular: 0, Ovulatory: 0, Luteal: 0 },
  };
  const filtered = filterByRange(symptoms, range).filter(s => s.bowel_movement);
  for (const log of filtered) {
    const past = cycles.filter(c => c.start_date <= log.log_date);
    if (!past.length || !log.bowel_movement) continue;
    const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const day = differenceInDays(parseLocalDate(log.log_date), parseLocalDate(latest.start_date)) + 1;
    if (day < 1 || day > avgLen + 7) continue;
    let phase: BowelPhase | null = null;
    if (day <= avgDur)      phase = 'Menstrual';
    else if (day <= avgLen - 16) phase = 'Follicular';
    else if (day <= avgLen - 11) phase = 'Ovulatory';
    else if (day <= avgLen)      phase = 'Luteal';
    if (phase) matrix[log.bowel_movement][phase]++;
  }
  return matrix;
}

function bmRowMax(matrix: HeatMatrix, bm: BowelMovement): number {
  return Math.max(...BOWEL_PHASES.map(p => matrix[bm][p]));
}

function cellOpacity(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  return 0.18 + 0.82 * (count / max);
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ── Tooltips ──────────────────────────────────────────────────────────────────

interface TooltipItem { dataKey: string; value: number; color: string }

function SeverityTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  if (!total) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-md" style={{ background: '#fff', border: '1px solid var(--color-peat-mid)', minWidth: 130 }}>
      <p className="font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{label} <span style={{ color: 'var(--color-peat-deep)' }}>({total}×)</span></p>
      {payload.filter(p => p.value > 0).map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="capitalize" style={{ color: 'var(--color-peat-deep)' }}>{p.dataKey}</span>
          <span className="ml-auto font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function CustomYTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const label = payload?.value ?? '';
  const maxChars = 20;
  const display = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={10} fill="var(--color-peat-deep)">
      {display}
    </text>
  );
}

function OtherTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-md" style={{ background: '#fff', border: '1px solid var(--color-peat-mid)', maxWidth: 200 }}>
      <p className="font-medium mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
      <p style={{ color: 'var(--color-peat-deep)' }}>{p.value}×</p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SymptomBarChart({ symptoms, cycles = [], avgCycleLength = 28, avgPeriodDuration = 5 }: Props) {
  const [range,      setRange]      = useState<Range>('30d');
  const [view,       setView]       = useState<View>('symptoms');
  const [hoveredBM,  setHoveredBM]  = useState<{ bm: BowelMovement; phase: BowelPhase } | null>(null);

  const allData    = buildData(symptoms, range);
  const data       = allData.filter(d => d.total > 0);
  const otherData  = buildOtherData(symptoms, range);
  const bmMatrix   = buildBowelMatrix(symptoms, cycles, range, avgCycleLength, avgPeriodDuration);
  const hasAny     = data.length > 0;
  const hasOther   = otherData.length > 0;
  const hasBowel   = BM_TYPES.some(bm => BOWEL_PHASES.some(p => bmMatrix[bm][p] > 0));

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Symptom frequency</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>Times logged by symptom</p>
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

      {/* View toggle */}
      <div className="px-5 pt-3 pb-0">
        <div className="flex rounded-lg p-0.5 w-fit" style={{ background: 'var(--color-peat-light)' }}>
          {([['symptoms', 'Key Symptoms'], ['other', 'Related'], ['bowel', 'Bowel']] as [View, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
              style={view === v
                ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                : { color: 'var(--color-peat-deep)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms chart */}
      {view === 'symptoms' && (
        <>
          <div className="px-4 pt-4 pb-2">
            {!hasAny ? (
              <div className="h-36 flex items-center justify-center">
                <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No symptoms logged in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(80, data.length * 44)}>
                <BarChart data={data} layout="vertical" barSize={16} barCategoryGap="25%">
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-peat-mid)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="symptom" width={70} tick={{ fontSize: 10, fill: 'var(--color-peat-deep)' }} axisLine={false} tickLine={false} interval={0} />
                  <Tooltip content={<SeverityTooltip />} cursor={{ fill: 'var(--color-peat-light)', radius: 4 }} />
                  <Bar dataKey="mild"     stackId="a" fill={MILD_COLOR}     name="mild"     />
                  <Bar dataKey="moderate" stackId="a" fill={MODERATE_COLOR} name="moderate" />
                  <Bar dataKey="severe"   stackId="a" fill={SEVERE_COLOR}   name="severe"   radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-5 pb-4 flex items-center gap-4">
            {([['mild', MILD_COLOR], ['moderate', MODERATE_COLOR], ['severe', SEVERE_COLOR]] as const).map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                <span className="text-xs capitalize" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Additional symptoms chart */}
      {view === 'other' && (
        <div className="px-4 pt-4 pb-4">
          {!hasOther ? (
            <div className="h-36 flex items-center justify-center">
              <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No related symptoms logged in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(80, otherData.length * 44)}>
              <BarChart data={otherData} layout="vertical" barSize={14} barCategoryGap="20%">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-peat-mid)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={145} tick={<CustomYTick />} axisLine={false} tickLine={false} interval={0} />
                <Tooltip content={<OtherTooltip />} cursor={{ fill: 'var(--color-peat-light)', radius: 4 }} />
                <Bar dataKey="count" fill={OTHER_COLOR} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Bowel heatmap */}
      {view === 'bowel' && (
        <div className="px-4 pt-4 pb-4">
          {!hasBowel ? (
            <div className="h-36 flex items-center justify-center">
              <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No bowel movement data logged in this period</p>
            </div>
          ) : (
            <>
              <p className="text-xs mb-3" style={{ color: 'var(--color-peat-deep)' }}>Darker = more frequent</p>
              {/* Column headers */}
              <div className="grid mb-1.5" style={{ gridTemplateColumns: '90px repeat(4, 1fr)', gap: '4px' }}>
                <div />
                {BOWEL_PHASES.map(phase => (
                  <div key={phase} className="text-center py-1 rounded-lg" style={{ background: PHASE_BG[phase], fontSize: '10px', color: 'var(--color-peat-deep)', fontWeight: 500 }}>
                    {phase}
                  </div>
                ))}
              </div>
              {/* Rows */}
              <div className="space-y-1">
                {BM_TYPES.map(bm => {
                  const max   = bmRowMax(bmMatrix, bm);
                  const color = BM_COLORS[bm];
                  return (
                    <div key={bm} className="grid items-center" style={{ gridTemplateColumns: '90px repeat(4, 1fr)', gap: '4px' }}>
                      <div className="flex items-center gap-1.5 pr-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span style={{ fontSize: '11px', color: 'var(--color-peat-deep)' }}>{BM_LABELS[bm]}</span>
                      </div>
                      {BOWEL_PHASES.map(phase => {
                        const count   = bmMatrix[bm][phase];
                        const opacity = cellOpacity(count, max);
                        const isHov   = hoveredBM?.bm === bm && hoveredBM?.phase === phase;
                        return (
                          <div
                            key={phase}
                            className="rounded-lg flex items-center justify-center transition-all"
                            style={{
                              height: '38px',
                              background: count > 0 ? `rgba(${hexToRgb(color)}, ${opacity})` : 'var(--color-peat-light)',
                              border: isHov ? `2px solid ${color}` : '2px solid transparent',
                            }}
                            onMouseEnter={() => setHoveredBM({ bm, phase })}
                            onMouseLeave={() => setHoveredBM(null)}
                          >
                            <span style={{ fontSize: '11px', fontWeight: 600, color: count > 0 ? (opacity > 0.55 ? '#fff' : color) : 'var(--color-peat-mid)' }}>
                              {count > 0 ? count : '–'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              {/* Hover label */}
              <div className="mt-3 h-5 flex items-center justify-center">
                {hoveredBM && bmMatrix[hoveredBM.bm][hoveredBM.phase] > 0 ? (
                  <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
                    <span className="font-medium">{BM_LABELS[hoveredBM.bm]}</span>{' logged '}
                    <span className="font-medium">{bmMatrix[hoveredBM.bm][hoveredBM.phase]}×</span>{' during '}
                    <span className="font-medium">{hoveredBM.phase}</span>
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>Hover a cell for details</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
