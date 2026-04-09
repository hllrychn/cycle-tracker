import { useState } from 'react';
import type { Cycle, FlowIntensity } from '../../types';
import { toISODate, addDays, parseISO } from '../../lib/dateUtils';

interface Props {
  existing?: Cycle | null;
  onSubmit: (data: { start_date: string; end_date: string | null; flow: FlowIntensity; notes: string | null }) => Promise<void>;
}

function durationFromDates(start: string, end: string): number {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return diff + 1;
}

const inputClass = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]';
const inputStyle = { border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)', color: 'var(--color-text-primary)', borderRadius: '10px' };

export function LogPeriodForm({ existing, onSubmit }: Props) {
  const [startDate, setStartDate] = useState(existing?.start_date ?? toISODate(new Date()));
  const [endDate, setEndDate] = useState(existing?.end_date ?? '');
  const [duration, setDuration] = useState<string>(() => {
    if (existing?.end_date) return String(durationFromDates(existing.start_date, existing.end_date));
    return '';
  });
  const [endMode, setEndMode] = useState<'date' | 'duration'>('date');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedEndDate = (): string | null => {
    if (endMode === 'duration') {
      const days = parseInt(duration, 10);
      if (!isNaN(days) && days >= 1 && days <= 14) {
        return toISODate(addDays(parseISO(startDate), days - 1));
      }
      return null;
    }
    return endDate || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const end = computedEndDate();
    if (endMode === 'date' && end && end < startDate) {
      setError('End date cannot be before start date.');
      return;
    }
    if (endMode === 'duration' && duration && (isNaN(parseInt(duration, 10)) || parseInt(duration, 10) < 1 || parseInt(duration, 10) > 14)) {
      setError('Duration must be between 1 and 14 days.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ start_date: startDate, end_date: end, flow: existing?.flow ?? 'medium', notes: notes.trim() || null });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-peat-deep)' }}>Start date *</label>
        <input
          type="date" required value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className={inputClass} style={inputStyle}
        />
      </div>

      <div>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-sm font-medium mr-1" style={{ color: 'var(--color-peat-deep)' }}>End</span>
          {(['date', 'duration'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setEndMode(mode)}
              className="px-3 py-0.5 rounded-full text-xs font-medium border transition-colors"
              style={endMode === mode
                ? { background: 'var(--color-moss-base)', color: 'white', borderColor: 'var(--color-moss-base)' }
                : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', borderColor: 'var(--color-peat-mid)' }
              }
            >
              {mode === 'date' ? 'End date' : 'Duration'}
            </button>
          ))}
          <span className="text-xs ml-1" style={{ color: 'var(--color-peat-deep)' }}>(optional)</span>
        </div>

        {endMode === 'date' ? (
          <input
            type="date" value={endDate} min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className={inputClass} style={inputStyle}
          />
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={14} value={duration} placeholder="e.g. 5"
              onChange={e => setDuration(e.target.value)}
              className="w-28 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              style={inputStyle}
            />
            <span className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>days</span>
            {duration && !isNaN(parseInt(duration, 10)) && parseInt(duration, 10) >= 1 && parseInt(duration, 10) <= 14 && (
              <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
                ends {computedEndDate()}
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-peat-deep)' }}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Any notes…"
          className={`${inputClass} resize-none`}
          style={inputStyle}
        />
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--color-accent-dark)' }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60"
        style={{ background: 'var(--color-moss-base)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-moss-dark)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-moss-base)')}
      >
        {loading ? 'Saving…' : existing ? 'Update period' : 'Log period'}
      </button>
    </form>
  );
}
