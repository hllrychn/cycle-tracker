import { useState } from 'react';
import { clearAllCycles } from '../../services/cycleService';
import { clearAllSymptoms } from '../../services/symptomService';

interface Props {
  onClose: () => void;
}

export function ClearHistoryModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleClear = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([clearAllCycles(), clearAllSymptoms()]);
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(46,40,32,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#FFFFFF', boxShadow: '0 8px 32px rgba(46,40,32,0.18)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-light)' }}>
            <span className="text-lg leading-none">⚠️</span>
          </div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Clear all history
          </h2>
        </div>

        <p className="text-sm mb-2" style={{ color: 'var(--color-peat-deep)' }}>
          This will permanently delete all your logged periods and symptoms.
        </p>
        <p className="text-sm font-medium mb-5" style={{ color: 'var(--color-accent-dark)' }}>
          This action cannot be undone.
        </p>

        <p className="text-sm mb-5" style={{ color: 'var(--color-peat-deep)' }}>
          Are you sure you want to delete everything?
        </p>

        {error && (
          <p className="text-xs mb-4" style={{ color: 'var(--color-accent-dark)' }}>{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}
          >
            Nevermind
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            {loading ? 'Clearing…' : 'Yes, clear all'}
          </button>
        </div>
      </div>
    </div>
  );
}
