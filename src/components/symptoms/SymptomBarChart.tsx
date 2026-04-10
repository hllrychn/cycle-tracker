import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { subDays, toISODate } from '../../lib/dateUtils';
import type { SymptomLog } from '../../types';

type Range = '7d' | '30d' | '90d' | '12m' | '1y';

interface Props {
  symptoms: SymptomLog[];
}

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: '7d',  label: '7d'        },
  { value: '30d', label: '30d'       },
  { value: '90d', label: '90d'       },
  { value: '12m', label: '12 months' },
  { value: '1y',  label: 'This year' },
];

const SYMPTOM_KEYS = [
  'cramps', 'bloating', 'headache', 'fatigue', 'breast_tenderness', 'spotting',
] as const;

type SymptomKey = typeof SYMPTOM_KEYS[number];

const SYMPTOM_LABELS: Record<SymptomKey, string> = {
  cramps:            'Cramps',
  bloating:          'Bloating',
  headache:          'Headache',
  fatigue:           'Fatigue',
  breast_tenderness: 'Breast',
  spotting:          'Spotting',
};

// Severity stack colors (consistent across all symptoms)
const MILD_COLOR     = '#A8C5A0'; // soft green
const MODERATE_COLOR = '#E8B87A'; // amber
const SEVERE_COLOR   = '#C47878'; // muted red

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
  // 1y — current calendar year
  const yearStart = `${today.getFullYear()}-01-01`;
  return symptoms.filter(s => s.log_date >= yearStart && s.log_date <= todayISO);
}

type ChartPoint = {
  symptom: string;
  key: SymptomKey;
  mild: number;
  moderate: number;
  severe: number;
  total: number;
};

function buildData(symptoms: SymptomLog[], range: Range): ChartPoint[] {
  const filtered = filterByRange(symptoms, range);
  return SYMPTOM_KEYS.map(k => {
    const mild     = filtered.filter(s => s[k] === 'mild').length;
    const moderate = filtered.filter(s => s[k] === 'moderate').length;
    const severe   = filtered.filter(s => s[k] === 'severe').length;
    return { symptom: SYMPTOM_LABELS[k], key: k, mild, moderate, severe, total: mild + moderate + severe };
  });
}

interface TooltipPayloadItem { dataKey: string; value: number; color: string }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
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

export function SymptomBarChart({ symptoms }: Props) {
  const [range, setRange] = useState<Range>('30d');
  const data = buildData(symptoms, range);
  const hasAny = data.some(d => d.total > 0);

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

      {/* Chart */}
      <div className="px-4 pt-4 pb-2">
        {!hasAny ? (
          <div className="h-36 flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No symptoms logged in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} barSize={32} barCategoryGap="30%">
              <XAxis
                dataKey="symptom"
                tick={{ fontSize: 10, fill: 'var(--color-peat-deep)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'var(--color-peat-mid)' }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-peat-light)', radius: 4 }} />
              <Bar dataKey="mild"     stackId="a" fill={MILD_COLOR}     name="mild"     />
              <Bar dataKey="moderate" stackId="a" fill={MODERATE_COLOR} name="moderate" />
              <Bar dataKey="severe"   stackId="a" fill={SEVERE_COLOR}   name="severe"   radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 flex items-center gap-4">
        {[['mild', MILD_COLOR], ['moderate', MODERATE_COLOR], ['severe', SEVERE_COLOR]].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
            <span className="text-xs capitalize" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
