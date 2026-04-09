import { useState } from 'react';
import { HealthyFoodsCard } from '../nutrition/HealthyFoodsCard';
import { WinePairingCard } from '../wine/WinePairingCard';
import { WineFoodPairingCard } from '../wine/WineFoodPairingCard';
import type { Cycle, Prediction } from '../../types';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

type Tab = 'eat' | 'wine' | 'food';

const TABS: { key: Tab; label: string }[] = [
  { key: 'eat',  label: 'Eat well'    },
  { key: 'wine', label: 'By phase'    },
  { key: 'food', label: 'Food & wine' },
];

export function HealthContentTabs({ cycles, prediction }: Props) {
  const [tab, setTab] = useState<Tab>('eat');

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}
    >
      {/* Tab switcher */}
      <div className="p-2" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div className="flex rounded-xl p-1" style={{ background: 'var(--color-peat-light)' }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium"
              style={tab === key
                ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                : { color: 'var(--color-peat-deep)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — bare components handle their own internal layout */}
      <div>
        {tab === 'eat'  && <HealthyFoodsCard    bare cycles={cycles} prediction={prediction} />}
        {tab === 'wine' && <WinePairingCard      bare cycles={cycles} prediction={prediction} />}
        {tab === 'food' && <WineFoodPairingCard      cycles={cycles} prediction={prediction} />}
      </div>
    </div>
  );
}
