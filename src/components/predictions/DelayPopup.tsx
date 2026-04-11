import { useEffect, useState } from 'react';
import { format } from '../../lib/dateUtils';

interface Props {
  nextPeriodStart: Date;
  onDelayOneDay: () => void | Promise<void>;
  forceShow?: boolean;
  startedToday?: boolean;
}

const STORAGE_KEY_PREFIX = 'delayPopupDismissed_';

export function DelayPopup({ nextPeriodStart, onDelayOneDay, forceShow, startedToday }: Props) {
  const key = STORAGE_KEY_PREFIX + format(nextPeriodStart, 'yyyy-MM-dd');
  const [visible, setVisible] = useState(() => forceShow || !localStorage.getItem(key));

  useEffect(() => {
    if (forceShow) { setVisible(true); return; }
    if (!localStorage.getItem(key)) setVisible(true);
  }, [key, forceShow]);

  const dismiss = () => {
    if (!forceShow) localStorage.setItem(key, '1');
    setVisible(false);
  };

  const handleDelay = async () => {
    await onDelayOneDay();
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={dismiss} />

      <div className="relative rounded-2xl w-full max-w-sm p-6 space-y-4" style={{ background: '#FFFFFF', boxShadow: '0 8px 40px rgba(46,40,32,0.18)', borderLeft: '4px solid var(--color-phase-menstrual)' }}>
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

        <div className="flex items-center justify-center w-12 h-12 rounded-full text-2xl mx-auto" style={{ background: 'var(--color-phase-menstrual)' }}>
          🗓️
        </div>

        <h2 className="text-base font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>
          {startedToday ? 'Period starts today' : 'Period expected tomorrow'}
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>
          {startedToday
            ? "Your period is logged as starting today. Not feeling it yet? Push it back by a day."
            : <>
                Your next period is predicted for{' '}
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {format(nextPeriodStart, 'MMMM d')}
                </span>
                . If you're not feeling it yet, you can push the prediction back by a day.
              </>
          }
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleDelay}
            className="w-full py-2.5 text-sm font-medium rounded-xl transition-colors"
            style={{ border: '1px solid var(--color-peat-mid)', color: 'var(--color-peat-deep)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-peat-light)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            Not yet — delay 1 day
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
