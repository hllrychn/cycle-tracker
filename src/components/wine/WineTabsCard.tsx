import { useState } from 'react';
import { WinePairingCard } from './WinePairingCard';
import { WineFoodPairingCard } from './WineFoodPairingCard';
import type { Cycle, Prediction } from '../../types';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

type Tab = 'phase' | 'food';

export function WineTabsCard({ cycles, prediction }: Props) {
  const [tab, setTab] = useState<Tab>('phase');

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-phase-menstrual)' }}
    >
      {/* Tab switcher */}
      <div className="p-2">
        <div className="flex rounded-xl p-1" style={{ background: 'var(--color-peat-light)' }}>
          {(['phase', 'food'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium"
              style={tab === t
                ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                : { color: 'var(--color-peat-deep)' }
              }
            >
              {t === 'phase' ? 'By phase' : 'Food & wine'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — no outer padding, cards handle their own */}
      <div>
        {tab === 'phase' && (
          <WinePairingCard bare cycles={cycles} prediction={prediction} />
        )}
        {tab === 'food' && (
          <WineFoodPairingCard cycles={cycles} prediction={prediction} />
        )}
      </div>
    </div>
  );
}
