import { useState } from 'react';
import { format, differenceInDays, startOfToday } from '../../lib/dateUtils';
import type { Prediction } from '../../types';

interface Props {
  prediction: Prediction | null;
  customCycleLength: number | null;
  customPeriodDuration: number | null;
  delayDays: number;
  recurringCyclesCount: number;
  onSetCycleLength: (days: number | null) => void;
  onSetPeriodDuration: (days: number | null) => void;
  onSetRecurringCyclesCount: (n: number) => void;
  bare?: boolean;
}

export function PredictionCard({
  prediction,
  customCycleLength,
  customPeriodDuration,
  delayDays,
  recurringCyclesCount,
  onSetCycleLength,
  onSetPeriodDuration,
  onSetRecurringCyclesCount,
  bare = false,
}: Props) {
  const [editingLength, setEditingLength] = useState(false);
  const [lengthInput, setLengthInput] = useState(String(customCycleLength ?? prediction?.avgCycleLength ?? 28));
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationInput, setDurationInput] = useState(String(customPeriodDuration ?? prediction?.avgPeriodDuration ?? 5));

  const handleSaveLength = () => {
    const val = parseInt(lengthInput, 10);
    if (!isNaN(val) && val >= 15 && val <= 49) {
      onSetCycleLength(val);
    } else {
      onSetCycleLength(null);
    }
    setEditingLength(false);
  };

  const handleSaveDuration = () => {
    const val = parseInt(durationInput, 10);
    if (!isNaN(val) && val >= 1 && val <= 14) {
      onSetPeriodDuration(val);
    } else {
      onSetPeriodDuration(null);
    }
    setEditingDuration(false);
  };

  const inputClass = 'w-14 px-2 py-0.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]';

  if (!prediction) {
    const emptyContent = (
      <>
        {!bare && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Predictions</h2>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)' }}>📅</div>
          </div>
        )}
        <p className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>Log at least one period to see predictions.</p>
      </>
    );
    if (bare) return emptyContent;
    return (
      <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}>
        {emptyContent}
      </div>
    );
  }

  const daysUntil = differenceInDays(prediction.nextPeriodStart, startOfToday());
  const isExpectedToday = daysUntil === 0;
  const isLate = daysUntil < 0;


  const confLabel = prediction.confidence === 'high' && customCycleLength
    ? 'Custom cycle'
    : `${prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} confidence`;

  const rowBase = `flex items-center justify-between ${bare ? 'py-1.5' : 'py-2.5'}`;
  const fixedRowStyle = bare ? { ...{ borderBottom: '1px solid var(--color-peat-light)' }, height: '36px', overflow: 'hidden' } : undefined;
  const divider = { borderBottom: '1px solid var(--color-peat-light)' };

  const content = (
    <div className={bare ? '' : 'rounded-2xl overflow-hidden h-full'} style={bare ? {} : { background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}>

      {/* Confidence + header (non-bare only) */}
      {!bare && (
        <div className="flex items-center justify-between px-5 py-4" style={divider}>
          <h2 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Predictions</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}>
            {confLabel}
          </span>
        </div>
      )}

      <div className="px-5" style={bare ? {} : { paddingTop: '4px' }}>
        {/* Confidence badge in bare mode */}
        {bare && (
          <div className="pt-1 pb-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}>
              {confLabel}
            </span>
          </div>
        )}

        {/* Date tiles */}
        <div className={`grid grid-cols-2 gap-2 ${bare ? 'mb-2' : 'mb-4'}`}>
          <div className={`rounded-xl px-3 ${bare ? 'py-2' : 'py-3'}`} style={{ background: 'var(--color-phase-menstrual)' }}>
            <p className="text-xs mb-1.5" style={{ color: 'var(--color-peat-deep)' }}>Next period</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {format(prediction.nextPeriodStart, 'MMM d')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>
              {isLate ? `${Math.abs(daysUntil)}d late` : isExpectedToday ? 'Today' : `in ${daysUntil}d`}
              {delayDays > 0 && <span className="ml-1 opacity-60">+{delayDays}d</span>}
            </p>
          </div>
          <div className={`rounded-xl px-3 ${bare ? 'py-2' : 'py-3'}`} style={{ background: 'var(--color-phase-follicular)' }}>
            <p className="text-xs mb-1.5" style={{ color: 'var(--color-blue-dark)' }}>Ovulation</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {format(prediction.ovulationDay, 'MMM d')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-blue-dark)' }}>
              {format(prediction.fertileWindowStart, 'MMM d')} – {format(prediction.fertileWindowEnd, 'MMM d')}
            </p>
          </div>
        </div>

        {/* Cycle length */}
        <div className={bare ? 'flex items-center justify-between' : rowBase} style={fixedRowStyle ?? divider}>
          <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Cycle length</span>
          {editingLength ? (
            <span className="flex items-center gap-1.5">
              <input
                type="number" min={15} max={49} value={lengthInput}
                onChange={e => setLengthInput(e.target.value)}
                className={inputClass}
                style={{ border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)', color: 'var(--color-text-primary)' }}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveLength(); if (e.key === 'Escape') setEditingLength(false); }}
              />
              <button onClick={handleSaveLength} className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--color-moss-dark)', background: 'var(--color-moss-light)' }}>Save</button>
              <button onClick={() => setEditingLength(false)} className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>✕</button>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {prediction.avgCycleLength}d{customCycleLength ? ' ·' : ''}
              </span>
              {customCycleLength && <button onClick={() => onSetCycleLength(null)} className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>reset</button>}
              <button onClick={() => { setLengthInput(String(customCycleLength ?? prediction.avgCycleLength)); setEditingLength(true); }} className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>✎</button>
            </span>
          )}
        </div>

        {/* Period duration */}
        <div className={bare ? 'flex items-center justify-between' : rowBase} style={fixedRowStyle ?? divider}>
          <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Period length</span>
          {editingDuration ? (
            <span className="flex items-center gap-1.5">
              <input
                type="number" min={1} max={14} value={durationInput}
                onChange={e => setDurationInput(e.target.value)}
                className={inputClass}
                style={{ border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)', color: 'var(--color-text-primary)' }}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveDuration(); if (e.key === 'Escape') setEditingDuration(false); }}
              />
              <button onClick={handleSaveDuration} className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--color-moss-dark)', background: 'var(--color-moss-light)' }}>Save</button>
              <button onClick={() => setEditingDuration(false)} className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>✕</button>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {prediction.avgPeriodDuration}d{customPeriodDuration ? ' ·' : ''}
              </span>
              {customPeriodDuration && <button onClick={() => onSetPeriodDuration(null)} className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>reset</button>}
              <button onClick={() => { setDurationInput(String(customPeriodDuration ?? prediction.avgPeriodDuration)); setEditingDuration(true); }} className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>✎</button>
            </span>
          )}
        </div>

        {/* Recurring cycles */}
        <div className={bare ? 'flex items-center justify-between' : rowBase} style={fixedRowStyle ?? { paddingBottom: '12px' }}>
          <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Cycles on calendar</span>
          <div className="flex gap-1">
            {[1, 2, 3, 6].map(n => (
              <button
                key={n}
                onClick={() => onSetRecurringCyclesCount(n)}
                className="w-6 h-6 rounded-full text-xs transition-colors"
                style={recurringCyclesCount === n
                  ? { background: 'var(--color-blue-base)', color: 'white' }
                  : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`px-5 ${bare ? 'py-1.5' : 'py-2.5'}`} style={{ borderTop: '1px solid var(--color-peat-light)' }}>
        <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>
          Estimates only — not medical advice.
        </p>
      </div>
    </div>
  );
  return content;
}
