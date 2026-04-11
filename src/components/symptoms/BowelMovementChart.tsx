import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
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

const BM_COLORS: Record<BowelMovement, string> = {
  normal:      '#A8C5A0',
  constipated: '#E8C07A',
  loose:       '#A088C4',
  diarrhea:    '#C47878',
};

const BM_LABELS: Record<BowelMovement, string> = {
  normal:      'Normal',
  constipated: 'Constipated',
  loose:       'Loose',
  diarrhea:    'Diarrhea',
};

const PHASES: Phase[] = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'];

const PHASE_BG: Record<Phase, string> = {
  Menstrual:  'var(--color-phase-menstrual)',
  Follicular: 'var(--color-phase-follicular)',
  Ovulatory:  'var(--color-phase-ovulation)',
  Luteal:     'var(--color-phase-luteal)',
};

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

function getPhase(logDate: string, cycles: Cycle[], avgLen: number, avgDur: number): Phase | null {
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

type ChartPoint = { phase: Phase } & Record<BowelMovement, number> & { total: number };

function buildData(symptoms: SymptomLog[], cycles: Cycle[], range: Range, avgLen: number, avgDur: number): ChartPoint[] {
  const filtered = filterByRange(symptoms, range).filter(s => s.bowel_movement);

  const counts: Record<Phase, Record<BowelMovement, number>> = {
    Menstrual:  { normal: 0, constipated: 0, loose: 0, diarrhea: 0 },
    Follicular: { normal: 0, constipated: 0, loose: 0, diarrhea: 0 },
    Ovulatory:  { normal: 0, constipated: 0, loose: 0, diarrhea: 0 },
    Luteal:     { normal: 0, constipated: 0, loose: 0, diarrhea: 0 },
  };

  for (const log of filtered) {
    const phase = getPhase(log.log_date, cycles, avgLen, avgDur);
    if (!phase || !log.bowel_movement) continue;
    counts[phase][log.bowel_movement]++;
  }

  return PHASES.map(phase => ({
    phase,
    normal:      counts[phase].normal,
    constipated: counts[phase].constipated,
    loose:       counts[phase].loose,
    diarrhea:    counts[phase].diarrhea,
    total:       BM_TYPES.reduce((s, t) => s + counts[phase][t], 0),
  }));
}

interface TooltipItem { dataKey: string; value: number; color: string }

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
          <span className="capitalize" style={{ color: 'var(--color-peat-deep)' }}>{BM_LABELS[p.dataKey as BowelMovement]}</span>
          <span className="ml-auto font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  symptoms: SymptomLog[];
  cycles: Cycle[];
  avgCycleLength: number;
  avgPeriodDuration: number;
}

export function BowelMovementChart({ symptoms, cycles, avgCycleLength, avgPeriodDuration }: Props) {
  const [range, setRange] = useState<Range>('30d');

  const data = buildData(symptoms, cycles, range, avgCycleLength, avgPeriodDuration);
  const hasAny = data.some(d => d.total > 0);

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
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>Frequency and type across your cycle</p>
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

      {/* Chart */}
      <div className="px-4 pt-4 pb-2">
        {!hasAny ? (
          <div className="h-36 flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No bowel movement data logged in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} barSize={28} barCategoryGap="30%">
              <XAxis
                dataKey="phase"
                tick={({ x, y, payload }) => {
                  const phase = payload.value as Phase;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <rect x={-26} y={4} width={52} height={16} rx={8} fill={PHASE_BG[phase]} />
                      <text x={0} y={16} textAnchor="middle" fontSize={9} fill="var(--color-peat-deep)" fontWeight={500}>
                        {phase}
                      </text>
                    </g>
                  );
                }}
                axisLine={false}
                tickLine={false}
                height={28}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--color-peat-mid)' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<BMTooltip />} cursor={{ fill: 'var(--color-peat-light)', radius: 4 }} />
              {BM_TYPES.map((type, i) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="a"
                  fill={BM_COLORS[type]}
                  radius={i === BM_TYPES.length - 1 ? [3, 3, 0, 0] : undefined}
                >
                  {data.map((entry) => (
                    <Cell key={entry.phase} fill={BM_COLORS[type]} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 flex items-center gap-4 flex-wrap">
        {BM_TYPES.map(type => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: BM_COLORS[type] }} />
            <span className="text-xs capitalize" style={{ color: 'var(--color-peat-deep)' }}>{BM_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
