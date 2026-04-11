import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { subDays, toISODate, differenceInDays, parseISO } from '../../lib/dateUtils';
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

// ── Bowel chart data ──────────────────────────────────────────────────────────

function getBowelPhase(logDate: string, cycles: Cycle[], avgLen: number, avgDur: number): BowelPhase | null {
  const past = cycles.filter(c => c.start_date <= logDate);
  if (past.length === 0) return null;
  const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  const day = differenceInDays(parseISO(logDate), parseISO(latest.start_date)) + 1;
  if (day < 1 || day > avgLen + 7) return null;
  if (day <= avgDur)       return 'Menstrual';
  if (day <= avgLen - 16)  return 'Follicular';
  if (day <= avgLen - 11)  return 'Ovulatory';
  if (day <= avgLen)       return 'Luteal';
  return null;
}

type BowelPoint = { phase: BowelPhase } & Record<BowelMovement, number> & { total: number };

function buildBowelData(symptoms: SymptomLog[], cycles: Cycle[], range: Range, avgLen: number, avgDur: number): BowelPoint[] {
  const filtered = filterByRange(symptoms, range).filter(s => s.bowel_movement);
  const counts: Record<BowelPhase, Record<BowelMovement, number>> = {
    Menstrual:  { normal: 0, constipated: 0, loose: 0, diarrhea: 0 },
    Follicular: { normal: 0, constipated: 0, loose: 0, diarrhea: 0 },
    Ovulatory:  { normal: 0, constipated: 0, loose: 0, diarrhea: 0 },
    Luteal:     { normal: 0, constipated: 0, loose: 0, diarrhea: 0 },
  };
  for (const log of filtered) {
    const phase = getBowelPhase(log.log_date, cycles, avgLen, avgDur);
    if (!phase || !log.bowel_movement) continue;
    counts[phase][log.bowel_movement]++;
  }
  return BOWEL_PHASES.map(phase => ({
    phase,
    normal:      counts[phase].normal,
    constipated: counts[phase].constipated,
    loose:       counts[phase].loose,
    diarrhea:    counts[phase].diarrhea,
    total:       BM_TYPES.reduce((s, t) => s + counts[phase][t], 0),
  }));
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

function BMTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const items = payload.filter(p => p.value > 0);
  if (!items.length) return null;
  const total = items.reduce((s, p) => s + p.value, 0);
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-md" style={{ background: '#fff', border: '1px solid var(--color-peat-mid)', minWidth: 140 }}>
      <p className="font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
        {label} <span style={{ color: 'var(--color-peat-deep)' }}>({total}×)</span>
      </p>
      {items.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span style={{ color: 'var(--color-peat-deep)' }}>{BM_LABELS[p.dataKey as BowelMovement]}</span>
          <span className="ml-auto font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function BowelPhaseTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const phase = (payload?.value ?? '') as BowelPhase;
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <rect x={-26} y={4} width={52} height={16} rx={8} fill={PHASE_BG[phase] ?? 'transparent'} />
      <text x={0} y={16} textAnchor="middle" fontSize={9} fill="var(--color-peat-deep)" fontWeight={500}>
        {phase}
      </text>
    </g>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SymptomBarChart({ symptoms, cycles = [], avgCycleLength = 28, avgPeriodDuration = 5 }: Props) {
  const [range, setRange] = useState<Range>('30d');
  const [view,  setView]  = useState<View>('symptoms');

  const allData    = buildData(symptoms, range);
  const data       = allData.filter(d => d.total > 0);
  const otherData  = buildOtherData(symptoms, range);
  const bowelData  = buildBowelData(symptoms, cycles, range, avgCycleLength, avgPeriodDuration);
  const hasAny     = data.length > 0;
  const hasOther   = otherData.length > 0;
  const hasBowel   = bowelData.some(d => d.total > 0);

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
          {([['symptoms', 'Symptoms'], ['other', 'Additional'], ['bowel', 'Bowel']] as [View, string][]).map(([v, label]) => (
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
              <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No additional symptoms logged in this period</p>
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

      {/* Bowel movement chart */}
      {view === 'bowel' && (
        <>
          <div className="px-4 pt-4 pb-2">
            {!hasBowel ? (
              <div className="h-36 flex items-center justify-center">
                <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No bowel movement data logged in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={bowelData} barSize={28} barCategoryGap="30%">
                  <XAxis
                    dataKey="phase"
                    tick={<BowelPhaseTick />}
                    axisLine={false}
                    tickLine={false}
                    height={28}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--color-peat-mid)' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<BMTooltip />} cursor={{ fill: 'var(--color-peat-light)', radius: 4 }} />
                  {BM_TYPES.map((type, i) => (
                    <Bar key={type} dataKey={type} stackId="a" fill={BM_COLORS[type]} radius={i === BM_TYPES.length - 1 ? [3, 3, 0, 0] : undefined}>
                      {bowelData.map(entry => (
                        <Cell key={entry.phase} fill={BM_COLORS[type]} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-5 pb-4 flex items-center gap-4 flex-wrap">
            {BM_TYPES.map(type => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: BM_COLORS[type] }} />
                <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>{BM_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
