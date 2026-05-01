import { useState } from 'react';
import { useCycles } from '../hooks/useCycles';
import { usePredictions } from '../hooks/usePredictions';
import { useSettings } from '../hooks/useSettings';
import { WinePairingCard } from '../components/wine/WinePairingCard';
import { WineFoodPairingCard } from '../components/wine/WineFoodPairingCard';
import { FloralCard } from '../components/floral/FloralCard';
import { FarmersMarketCard } from '../components/lifestyle/FarmersMarketCard';
import { format } from '../lib/dateUtils';
import { PixelLoader } from '../components/ui/PixelLoader';

type Tab = 'phase' | 'food';

const TABS: { key: Tab; label: string }[] = [
  { key: 'phase', label: 'Wine pairings' },
  { key: 'food',  label: 'Food & wine'  },
];

export function LifestylePage() {
  const [tab, setTab] = useState<Tab>('phase');
  const { cycles, loading: cyclesLoading } = useCycles();
  const { customCycleLength, customPeriodDuration, nextPeriodDelayDays } = useSettings();
  const prediction = usePredictions(cycles, { customCycleLength, customPeriodDuration, delayDays: nextPeriodDelayDays });

  if (cyclesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <PixelLoader size={56} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-3xl md:text-[38px]" style={{ color: 'var(--color-text-primary)' }}>Lifestyle</h1>
        <p className="text-sm mt-2" style={{ color: '#F0EDE6' }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Wine card */}
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}
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

        <div>
          {tab === 'phase' && <WinePairingCard  bare cycles={cycles} prediction={prediction} />}
          {tab === 'food'  && <WineFoodPairingCard    cycles={cycles} prediction={prediction} />}
        </div>
      </div>

      {/* Floral card — own container */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-phase-ovulation)' }}
      >
        <FloralCard bare cycles={cycles} prediction={prediction} />
      </div>

      {/* Farmers market card — own container */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}
      >
        <FarmersMarketCard bare cycles={cycles} prediction={prediction} />
      </div>
    </div>
  );
}
