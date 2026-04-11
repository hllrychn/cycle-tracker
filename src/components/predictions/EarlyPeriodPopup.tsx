import { useEffect, useState } from 'react';
import { format } from '../../lib/dateUtils';

interface Props {
  nextPeriodStart: Date;
  daysUntilNext: number;
  onStartToday: () => Promise<void>;
  forceShow?: boolean;
}

const STORAGE_KEY_PREFIX = 'earlyPeriodPopupDismissed_';

export function EarlyPeriodPopup({ nextPeriodStart, daysUntilNext, onStartToday, forceShow }: Props) {
  const key = STORAGE_KEY_PREFIX + format(nextPeriodStart, 'yyyy-MM-dd');
  const [visible, setVisible] = useState(() => forceShow || !localStorage.getItem(key));
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (forceShow) { setVisible(true); return; }
    if (!localStorage.getItem(key)) setVisible(true);
  }, [key, forceShow]);

  const dismiss = () => {
    if (!forceShow) localStorage.setItem(key, '1');
    setVisible(false);
  };

  const handleStartToday = async () => {
    setStarting(true);
    try {
      await onStartToday();
      dismiss();
    } finally {
      setStarting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={dismiss} />

      <div
        className="relative rounded-2xl w-full max-w-sm p-6 space-y-4"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 8px 40px rgba(46,40,32,0.18)',
          borderLeft: '4px solid var(--color-moss-base)',
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-2xl leading-none transition-colors"
          style={{ color: 'var(--color-peat-deep)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
          aria-label="Close"
        >
          ×
        </button>

        <div
          className="flex items-center justify-center w-12 h-12 rounded-full text-2xl mx-auto"
          style={{ background: 'var(--color-phase-menstrual)' }}
        >
          🌸
        </div>

        <h2 className="text-base font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>
          Period coming in {daysUntilNext} day{daysUntilNext === 1 ? '' : 's'}
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>
          Your next period is predicted for{' '}
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {format(nextPeriodStart, 'MMMM d')}
          </span>
          . If it started early, you can log it now.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleStartToday}
            disabled={starting}
            className="w-full py-2.5 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-moss-base)' }}
            onMouseEnter={e => { if (!starting) e.currentTarget.style.filter = 'brightness(0.92)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
          >
            {starting ? 'Logging…' : 'Period started early'}
          </button>
          <button
            onClick={dismiss}
            className="w-full py-2 text-sm transition-colors"
            style={{ color: 'var(--color-peat-deep)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
