import type { Prediction, SymptomLog } from '../../types';

interface Props {
  prediction: Prediction | null;
  totalCycles: number;
  symptoms: SymptomLog[];
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

interface StatItem {
  label: string;
  value: string;
  accent: string;
}

function TickerItem({ label, value, accent }: StatItem) {
  return (
    <span className="inline-flex items-center gap-2 shrink-0" style={{ padding: '0 28px' }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
      <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </span>
  );
}

export function StatsTickerStrip({ prediction, totalCycles, symptoms }: Props) {
  const topMood = topMoodEmoji(symptoms);
  const variation = prediction?.cycleVariation;

  const stats: StatItem[] = [
    { label: 'Cycles logged',  value: String(totalCycles),                               accent: 'var(--color-accent)'   },
    { label: 'Avg cycle',      value: prediction ? `${prediction.avgCycleLength}d` : '—', accent: 'var(--color-moss-base)' },
    { label: 'Avg period',     value: prediction ? `${prediction.avgPeriodDuration}d` : '—', accent: 'var(--color-blue-base)' },
    { label: 'Cycle variation',value: variation != null ? `${variation}d` : '—',         accent: 'var(--color-peat-deep)' },
    { label: 'Top mood',       value: topMood ?? '—',                                    accent: 'var(--color-accent)'   },
  ];

  // Duplicate for seamless loop: animate -50% = exactly one copy's width
  const items = [...stats, ...stats];

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .stats-ticker-inner {
          animation: ticker-scroll 22s linear infinite;
          will-change: transform;
        }
        .stats-ticker-inner:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className="rounded-xl overflow-hidden flex items-stretch"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(46,40,32,0.07)',
          borderLeft: '4px solid var(--color-accent)',
          height: '42px',
        }}
      >
        {/* Static label */}
        <div
          className="flex items-center px-3 shrink-0"
          style={{ borderRight: '1px solid var(--color-peat-light)', background: 'var(--color-peat-light)' }}
        >
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--color-peat-deep)' }}
          >
            Stats
          </span>
        </div>

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden flex items-center">
          <div className="stats-ticker-inner flex items-center whitespace-nowrap">
            {items.map((stat, i) => (
              <TickerItem key={i} {...stat} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
