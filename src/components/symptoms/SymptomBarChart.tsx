import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { format, subDays, toISODate, parseISO } from '../../lib/dateUtils';
import type { SymptomLog, Severity } from '../../types';

type Range = '7d' | '30d' | '90d' | '1y';

interface Props {
  symptoms: SymptomLog[];
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '7d',  label: '7d'      },
  { value: '30d', label: '30d'     },
  { value: '90d', label: '90d'     },
  { value: '1y',  label: '1 year'  },
];

const SYMPTOM_KEYS = [
  'cramps', 'bloating', 'headache', 'fatigue', 'breast_tenderness', 'spotting',
] as const;

type SymptomKey = typeof SYMPTOM_KEYS[number];

const SYMPTOM_COLORS: Record<SymptomKey, string> = {
  cramps:            '#c89fc1',
  bloating:          '#7B9DB8',
  headache:          '#8FAE88',
  fatigue:           '#C4A882',
  breast_tenderness: '#D49B6A',
  spotting:          '#A088C4',
};

const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  cramps:            'Cramps',
  bloating:          'Bloating',
  headache:          'Headache',
  fatigue:           'Fatigue',
  breast_tenderness: 'Breast tenderness',
  spotting:          'Spotting',
};

const SEVERITY_SCORE: Record<Severity, number> = { none: 0, mild: 1, moderate: 2, severe: 3 };

type ChartPoint = { label: string; date: string; logged: boolean } & Record<SymptomKey, number>;

function scoreLog(log: SymptomLog): Record<SymptomKey, number> {
  return Object.fromEntries(
    SYMPTOM_KEYS.map(k => [k, SEVERITY_SCORE[log[k]]])
  ) as Record<SymptomKey, number>;
}

function emptyScores(): Record<SymptomKey, number> {
  return Object.fromEntries(SYMPTOM_KEYS.map(k => [k, 0])) as Record<SymptomKey, number>;
}

function buildData(symptoms: SymptomLog[], range: Range): ChartPoint[] {
  const today = new Date();

  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d   = subDays(today, days - 1 - i);
      const iso = toISODate(d);
      const log = symptoms.find(s => s.log_date === iso) ?? null;
      return {
        date:   iso,
        label:  range === '7d' ? format(d, 'EEE') : format(d, 'MMM d'),
        logged: !!log,
        ...(log ? scoreLog(log) : emptyScores()),
      };
    });
  }

  if (range === '90d') {
    const weeks = 13;
    return Array.from({ length: weeks }, (_, w) => {
      const weekEnd   = subDays(today, (weeks - 1 - w) * 7);
      const weekStart = subDays(weekEnd, 6);
      const ws = toISODate(weekStart);
      const we = toISODate(weekEnd);
      const weekLogs = symptoms.filter(s => s.log_date >= ws && s.log_date <= we);
      const totals = emptyScores();
      for (const log of weekLogs) {
        for (const k of SYMPTOM_KEYS) totals[k] += SEVERITY_SCORE[log[k]];
      }
      return { date: ws, label: format(parseISO(ws), 'MMM d'), logged: weekLogs.length > 0, ...totals };
    });
  }

  // 1y — monthly for current calendar year
  const year = today.getFullYear();
  return Array.from({ length: 12 }, (_, m) => {
    const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
    const monthLogs = symptoms.filter(s => s.log_date.startsWith(monthKey));
    const totals = emptyScores();
    for (const log of monthLogs) {
      for (const k of SYMPTOM_KEYS) totals[k] += SEVERITY_SCORE[log[k]];
    }
    return {
      date:   monthKey,
      label:  format(new Date(year, m, 1), 'MMM'),
      logged: monthLogs.length > 0,
      ...totals,
    };
  });
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const entries = payload.filter(p => p.value > 0);
  if (!entries.length) return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-md" style={{ background: '#fff', border: '1px solid var(--color-peat-mid)', color: 'var(--color-peat-deep)' }}>
      <p className="font-medium mb-0.5">{label}</p>
      <p>No symptoms logged</p>
    </div>
  );
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-md" style={{ background: '#fff', border: '1px solid var(--color-peat-mid)', minWidth: 140 }}>
      <p className="font-semibold mb-1.5" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
      {entries.map(e => (
        <div key={e.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
          <span style={{ color: 'var(--color-peat-deep)' }}>{SYMPTOM_LABELS[e.dataKey as SymptomKey]}</span>
          <span className="ml-auto font-medium" style={{ color: 'var(--color-text-primary)' }}>{e.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SymptomBarChart({ symptoms }: Props) {
  const [range, setRange] = useState<Range>('30d');
  const data = buildData(symptoms, range);
  const hasAny = data.some(d => d.logged);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Symptom history</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>Severity score per day</p>
        </div>
        {/* Range filter */}
        <div className="flex items-center gap-1">
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
      <div className="px-2 pt-4 pb-2">
        {!hasAny ? (
          <div className="h-36 flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No symptoms logged in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} barSize={range === '1y' ? 22 : range === '7d' ? 28 : 8} barGap={0}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-peat-deep)' }}
                axisLine={false}
                tickLine={false}
                interval={range === '30d' ? 4 : 0}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-peat-light)', radius: 4 }} />
              {SYMPTOM_KEYS.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={SYMPTOM_COLORS[key]}
                  radius={i === SYMPTOM_KEYS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                >
                  {data.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.logged ? SYMPTOM_COLORS[key] : 'var(--color-peat-light)'}
                      fillOpacity={entry.logged ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 flex flex-wrap gap-x-3 gap-y-1">
        {SYMPTOM_KEYS.map(k => (
          <div key={k} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SYMPTOM_COLORS[k] }} />
            <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>{SYMPTOM_LABELS[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
