import { useState } from 'react';
import { FUN_FACTS } from '../../data/funFacts';
import { format } from '../../lib/dateUtils';

function randomIndex(exclude?: number): number {
  if (FUN_FACTS.length <= 1) return 0;
  let idx: number;
  do { idx = Math.floor(Math.random() * FUN_FACTS.length); }
  while (idx === exclude);
  return idx;
}

function todayKey(): string {
  return 'funFactDismissed_' + format(new Date(), 'yyyy-MM-dd');
}

interface Props {
  forceShow?: boolean;
  onClose?: () => void;
}

export function FunFactPopup({ forceShow = false, onClose }: Props) {
  const [visible, setVisible] = useState(() => forceShow || !localStorage.getItem(todayKey()));
  const [idx, setIdx] = useState(() => randomIndex());

  const dismiss = () => {
    if (!forceShow) localStorage.setItem(todayKey(), '1');
    setVisible(false);
    onClose?.();
  };

  const shuffle = () => setIdx(prev => randomIndex(prev));

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={dismiss} />

      <div
        className="relative rounded-2xl w-full max-w-md p-6 space-y-4"
        style={{ background: '#FFFFFF', boxShadow: '0 8px 40px rgba(46,40,32,0.18)', borderLeft: '4px solid var(--color-accent)' }}
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

        <div className="flex items-center justify-center w-12 h-12 rounded-full text-2xl mx-auto" style={{ background: 'var(--color-accent-light)' }}>
          💡
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Did you know?</h2>
          <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>{idx + 1} / {FUN_FACTS.length}</span>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>
          {FUN_FACTS[idx]}
        </p>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={shuffle}
            className="text-xs transition-colors"
            style={{ color: 'var(--color-moss-dark)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-moss-base)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-moss-dark)')}
          >
            Show another →
          </button>
          <button
            onClick={dismiss}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-peat-mid)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-peat-light)')}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
