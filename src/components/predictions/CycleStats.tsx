import type { Prediction, SymptomLog } from '../../types';

interface Props {
  prediction: Prediction | null;
  totalCycles: number;
  symptoms?: SymptomLog[];
  bare?: boolean;
}

function topMoodEmoji(symptoms: SymptomLog[]): string | null {
  const counts: Record<string, number> = {};
  for (const s of symptoms) {
    if (s.feeling_emoji) counts[s.feeling_emoji] = (counts[s.feeling_emoji] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

export function CycleStats({ prediction, totalCycles, symptoms = [], bare = false }: Props) {
  const topMood = topMoodEmoji(symptoms);
  const variation = prediction?.cycleVariation;

  const stats = [
    { label: 'Cycles logged',    value: String(totalCycles),                                       accent: 'var(--color-accent)'   },
    { label: 'Avg cycle length', value: prediction ? `${prediction.avgCycleLength}d` : '—',        accent: 'var(--color-moss-base)' },
    { label: 'Avg period',       value: prediction ? `${prediction.avgPeriodDuration}d` : '—',     accent: 'var(--color-blue-base)' },
    { label: 'Cycle variation',  value: variation != null ? `${variation}d` : '—',                 accent: 'var(--color-peat-deep)' },
    { label: 'Top mood',         value: topMood ?? '—',                                            accent: 'var(--color-accent)'   },
  ];

  const inner = (
    <div className="divide-y" style={{ borderColor: 'var(--color-peat-light)' }}>
      {!bare && (
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stats</p>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)' }}>📊</div>
        </div>
      )}
      {stats.map(({ label, value, accent }) => (
        <div key={label} className="flex items-center justify-between px-5 py-3">
          <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: accent }}
            />
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: 'var(--color-text-primary)', fontSize: label === 'Top mood' && topMood ? '1.25rem' : undefined, lineHeight: 1 }}
            >
              {value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  if (bare) return inner;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}
    >
      {inner}
    </div>
  );
}
