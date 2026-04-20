import { useState } from 'react';
import { ClearHistoryModal } from '../components/account/ClearHistoryModal';

export function SettingsPage() {
  const [showClearModal, setShowClearModal] = useState(false);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-semibold text-3xl md:text-[38px]" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
        <p className="text-sm mt-2" style={{ color: '#F0EDE6' }}>Manage your account and data</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-peat-deep)' }}>Data</p>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Clear history</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-peat-deep)' }}>
                Permanently delete all logged periods and symptoms. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowClearModal(true)}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent-light)')}
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      {showClearModal && <ClearHistoryModal onClose={() => setShowClearModal(false)} />}
    </div>
  );
}
