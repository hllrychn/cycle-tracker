import { useState } from 'react';
import { ClearHistoryModal } from '../components/account/ClearHistoryModal';
import { useCycles } from '../hooks/useCycles';
import { useSymptoms } from '../hooks/useSymptoms';
import { usePredictions } from '../hooks/usePredictions';
import { useSettings } from '../hooks/useSettings';
import { exportSymptomsToExcel } from '../lib/exportSymptoms';

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

export function SettingsPage() {
  const [showClearModal, setShowClearModal] = useState(false);
  const [exporting, setExporting]           = useState(false);

  const { cycles }   = useCycles();
  const { symptoms } = useSymptoms();
  const { customCycleLength, customPeriodDuration, nextPeriodDelayDays } = useSettings();
  const prediction   = usePredictions(cycles, { customCycleLength, customPeriodDuration, delayDays: nextPeriodDelayDays });

  const handleExport = async () => {
    setExporting(true);
    try {
      exportSymptomsToExcel(symptoms, cycles, prediction);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-semibold text-3xl md:text-[38px]" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
        <p className="text-sm mt-2" style={{ color: '#F0EDE6' }}>Manage your account and data</p>
      </div>

      {/* Export */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-peat-deep)' }}>Export</p>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Download symptom data</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-peat-deep)' }}>
                Export all logged entries as an Excel spreadsheet — includes date, phase, symptoms, BBT, mood, and more.
              </p>
              {symptoms.length === 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-peat-mid)' }}>No symptom logs yet.</p>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || symptoms.length === 0}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)' }}
              onMouseEnter={e => { if (!exporting && symptoms.length > 0) e.currentTarget.style.background = 'var(--color-moss-mid)'; }}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-moss-light)')}
            >
              <DownloadIcon />
              {exporting ? 'Exporting…' : 'Export .xlsx'}
            </button>
          </div>
        </div>
      </div>

      {/* Data management */}
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
