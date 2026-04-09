import { useState } from 'react';
import { format, parseISO, differenceInDays } from '../../lib/dateUtils';
import type { Cycle, FlowIntensity } from '../../types';
import { LogPeriodForm } from './LogPeriodForm';

interface Props {
  cycle: Cycle;
  nextCycleStart?: string;
  onDelete: (id: string) => Promise<void>;
  onEdit: (data: { start_date: string; end_date: string | null; flow: FlowIntensity; notes: string | null }, options?: { excludeId?: string }) => Promise<void>;
}

const FLOW_STYLE: Record<string, { bg: string; color: string }> = {
  spotting: { bg: 'var(--color-peat-light)',      color: 'var(--color-peat-deep)'  },
  light:    { bg: 'var(--color-phase-menstrual)', color: 'var(--color-text-primary)' },
  medium:   { bg: 'var(--color-peat-mid)',        color: 'var(--color-peat-dark)'  },
  heavy:    { bg: 'var(--color-peat-deep)',       color: 'var(--color-text-light)' },
};

export function PeriodEntry({ cycle, nextCycleStart, onDelete, onEdit }: Props) {
  const [editing, setEditing]     = useState(false);
  const [deleting, setDeleting]   = useState(false);

  const cycleLength = nextCycleStart
    ? differenceInDays(parseISO(nextCycleStart), parseISO(cycle.start_date))
    : null;

  const periodDuration = cycle.end_date
    ? differenceInDays(parseISO(cycle.end_date), parseISO(cycle.start_date)) + 1
    : null;

  const handleEdit = async (data: { start_date: string; end_date: string | null; flow: FlowIntensity; notes: string | null }) => {
    if (data.start_date !== cycle.start_date) {
      await onDelete(cycle.id);
    }
    await onEdit(data, { excludeId: cycle.id });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!deleting) { setDeleting(true); return; }
    await onDelete(cycle.id);
  };

  if (editing) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium" style={{ color: 'var(--color-peat-deep)' }}>
            Editing {format(parseISO(cycle.start_date), 'MMM d, yyyy')}
          </span>
          <button onClick={() => setEditing(false)} className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
            Cancel
          </button>
        </div>
        <LogPeriodForm existing={cycle} onSubmit={handleEdit} />
      </div>
    );
  }

  const fs = FLOW_STYLE[cycle.flow] ?? FLOW_STYLE.medium;

  return (
    <div className="px-4 py-3 flex items-center gap-4">
      {/* Date range + duration */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {format(parseISO(cycle.start_date), 'MMM d')}
          </span>
          {cycle.end_date ? (
            <>
              <span className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>→</span>
              <span className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>
                {format(parseISO(cycle.end_date), 'MMM d')}
              </span>
            </>
          ) : (
            <span className="text-xs italic" style={{ color: 'var(--color-peat-mid)' }}>ongoing</span>
          )}
          <span className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>
            {format(parseISO(cycle.start_date), 'yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium" style={{ background: fs.bg, color: fs.color }}>
            {cycle.flow}
          </span>
          {periodDuration && (
            <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
              {periodDuration}d period
            </span>
          )}
          {cycleLength && (
            <>
              <span className="text-xs" style={{ color: 'var(--color-peat-light)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
                {cycleLength}d cycle
              </span>
            </>
          )}
        </div>

        {cycle.notes && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-peat-deep)' }}>{cycle.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs transition-colors"
          style={{ color: 'var(--color-peat-mid)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-mid)')}
        >
          Edit
        </button>
        {deleting ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Delete?</span>
            <button
              onClick={handleDelete}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}
            >
              Yes
            </button>
            <button
              onClick={() => setDeleting(false)}
              className="text-xs"
              style={{ color: 'var(--color-peat-mid)' }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="text-xs transition-colors"
            style={{ color: 'var(--color-peat-light)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent)' )}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-light)')}
            aria-label="Delete"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
