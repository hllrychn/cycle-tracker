import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from '../../lib/dateUtils';

interface Props {
  nextPeriodStart: Date;
  forceShow?: boolean;
}

const STORAGE_KEY_PREFIX = 'cycleCheckDismissed_';

export function CycleCheckPopup({ nextPeriodStart, forceShow = false }: Props) {
  const navigate = useNavigate();
  const key = STORAGE_KEY_PREFIX + format(nextPeriodStart, 'yyyy-MM-dd');
  const [visible, setVisible] = useState(() => forceShow || !localStorage.getItem(key));

  useEffect(() => {
    if (forceShow || !localStorage.getItem(key)) setVisible(true);
  }, [key, forceShow]);

  const dismiss = () => {
    localStorage.setItem(key, '1');
    setVisible(false);
  };

  const goLog = () => {
    dismiss();
    navigate('/log/period');
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={dismiss} />

      <div className="relative rounded-2xl w-full max-w-md p-6 space-y-4" style={{ background: '#FFFFFF', boxShadow: '0 8px 40px rgba(46,40,32,0.18)', borderLeft: '4px solid var(--color-phase-ovulation)' }}>
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

        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-phase-ovulation)] text-2xl mx-auto">
          🔍
        </div>

        <h2 className="text-lg font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>
          Time to double-check your cycle
        </h2>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>
          Today is when you can double-check how long your cycle will be this month. That's because,
          generally speaking, the first half of your cycle is the part that varies in length while
          the second half is typically a stable 14 days (barring stress, illness, medications and
          other things that can make your cycle wonky). So, by double-checking that you're really on
          the first day of your Week 3, you can confirm there are 14 days left to your cycle. And,
          lucky for you, all it takes to find out if you're still on track is clicking the
          "Check Your Cycle" button.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={goLog}
            className="w-full py-2.5 text-white font-medium rounded-xl text-sm transition-colors"
            style={{ background: 'var(--color-moss-base)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-moss-dark)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-moss-base)')}
          >
            Check Your Cycle
          </button>
          <button
            onClick={dismiss}
            className="w-full py-2 text-sm transition-colors"
            style={{ color: 'var(--color-peat-deep)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
