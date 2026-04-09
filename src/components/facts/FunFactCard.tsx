import { useState } from 'react';
import { FUN_FACTS } from '../../data/funFacts';

function randomIndex(exclude?: number): number {
  if (FUN_FACTS.length <= 1) return 0;
  let idx: number;
  do { idx = Math.floor(Math.random() * FUN_FACTS.length); }
  while (idx === exclude);
  return idx;
}

export function FunFactCard() {
  const [idx, setIdx] = useState(() => randomIndex());

  const shuffle = () => setIdx(prev => randomIndex(prev));

  return (
    <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Did you know?</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>{idx + 1} / {FUN_FACTS.length}</span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}>💡</div>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-peat-deep)' }}>
        {FUN_FACTS[idx]}
      </p>

      <button
        onClick={shuffle}
        className="text-xs transition-colors"
        style={{ color: 'var(--color-moss-dark)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-moss-base)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-moss-dark)')}
      >
        Show another →
      </button>
    </div>
  );
}
