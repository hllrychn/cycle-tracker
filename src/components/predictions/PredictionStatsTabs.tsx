import { useState } from 'react';
import { PredictionCard } from './PredictionCard';
import { HormoneChart } from '../hormones/HormoneChart';
import type { Prediction } from '../../types';
import type { Cycle } from '../../types';

interface Props {
  prediction: Prediction | null;
  cycles: Cycle[];
  customCycleLength: number | null;
  customPeriodDuration: number | null;
  delayDays: number;
  recurringCyclesCount: number;
  onSetCycleLength: (days: number | null) => void;
  onSetPeriodDuration: (days: number | null) => void;
  onSetRecurringCyclesCount: (n: number) => void;
}

type Tab = 'hormones' | 'predictions';

const TAB_LABELS: Record<Tab, string> = {
  hormones:    'Hormones',
  predictions: 'Predictions',
};

export function PredictionStatsTabs({
  prediction,
  cycles,
  customCycleLength,
  customPeriodDuration,
  delayDays,
  recurringCyclesCount,
  onSetCycleLength,
  onSetPeriodDuration,
  onSetRecurringCyclesCount,
}: Props) {
  const [tab, setTab] = useState<Tab>('hormones');

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col md:h-[344px]"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}
    >
      {/* Tab switcher */}
      <div className="p-2">
        <div className="flex rounded-xl p-1" style={{ background: 'var(--color-peat-light)' }}>
          {(['hormones', 'predictions'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium"
              style={tab === t
                ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                : { color: 'var(--color-peat-deep)' }
              }
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden px-5 pb-3">
        {tab === 'hormones' && (
          <HormoneChart bare cycles={cycles} prediction={prediction} />
        )}
        {tab === 'predictions' && (
          <PredictionCard
            bare
            prediction={prediction}
            customCycleLength={customCycleLength}
            customPeriodDuration={customPeriodDuration}
            delayDays={delayDays}
            recurringCyclesCount={recurringCyclesCount}
            onSetCycleLength={onSetCycleLength}
            onSetPeriodDuration={onSetPeriodDuration}
            onSetRecurringCyclesCount={onSetRecurringCyclesCount}
          />
        )}
      </div>
    </div>
  );
}
