import { useState } from 'react';
import type { Medication, MedicationInput } from '../../services/medicationService';

interface Props {
  medications: Medication[];
  onSave: (data: MedicationInput) => Promise<Medication>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

const TYPE_LABELS: { value: Medication['type']; label: string }[] = [
  { value: 'birth_control', label: 'Birth control' },
  { value: 'medication',    label: 'Medication' },
  { value: 'supplement',    label: 'Supplement' },
  { value: 'other',         label: 'Other' },
];

const TYPE_COLORS: Record<Medication['type'], { bg: string; color: string }> = {
  birth_control: { bg: 'var(--color-accent-light)',  color: 'var(--color-accent-dark)' },
  medication:    { bg: 'var(--color-blue-light)',     color: 'var(--color-blue-dark)' },
  supplement:    { bg: 'var(--color-moss-light)',     color: 'var(--color-moss-dark)' },
  other:         { bg: 'var(--color-peat-mid)',       color: 'var(--color-peat-deep)' },
};

const inputCls = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-base)]';
const inputStyle = {
  border: '1px solid var(--color-peat-mid)',
  background: 'var(--color-peat-light)',
  color: 'var(--color-text-primary)',
};
const labelStyle = {
  color: 'var(--color-peat-deep)',
  fontSize: '11px',
  fontWeight: 500 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

function MedForm({
  existing,
  onSave,
  onCancel,
}: {
  existing?: Medication;
  onSave: (data: MedicationInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name,      setName]      = useState(existing?.name      ?? '');
  const [type,      setType]      = useState<Medication['type']>(existing?.type ?? 'medication');
  const [dose,      setDose]      = useState(existing?.dose       ?? '');
  const [frequency, setFrequency] = useState(existing?.frequency  ?? '');
  const [startDate, setStartDate] = useState(existing?.start_date ?? '');
  const [endDate,   setEndDate]   = useState(existing?.end_date   ?? '');
  const [notes,     setNotes]     = useState(existing?.notes      ?? '');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id:        existing?.id,
        name:      name.trim(),
        type,
        dose:       dose.trim()  || null,
        frequency:  frequency.trim() || null,
        start_date: startDate   || null,
        end_date:   endDate     || null,
        notes:      notes.trim() || null,
        active:    existing?.active ?? true,
      });
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <div>
        <label className="block mb-1" style={labelStyle}>Name *</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Ibuprofen, Sprintec, Iron…"
          className={inputCls} style={inputStyle}
        />
      </div>

      <div>
        <label className="block mb-1" style={labelStyle}>Type</label>
        <div className="flex flex-wrap gap-2">
          {TYPE_LABELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className="px-3 py-1 rounded-full text-xs transition-colors"
              style={type === value
                ? { background: 'var(--color-blue-base)', color: '#fff' }
                : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1" style={labelStyle}>Dose</label>
          <input
            type="text" value={dose} onChange={e => setDose(e.target.value)}
            placeholder="e.g. 200mg, 1 pill…"
            className={inputCls} style={inputStyle}
          />
        </div>
        <div>
          <label className="block mb-1" style={labelStyle}>Frequency</label>
          <input
            type="text" value={frequency} onChange={e => setFrequency(e.target.value)}
            placeholder="e.g. daily, as needed…"
            className={inputCls} style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block mb-1" style={labelStyle}>Start date</label>
          <input
            type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>
        <div>
          <label className="block mb-1" style={labelStyle}>End date</label>
          <input
            type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className={inputCls} style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block mb-1" style={labelStyle}>Notes</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Side effects, reminders, instructions…"
          rows={2}
          className={`${inputCls} resize-none`} style={inputStyle}
        />
      </div>

      {error && <p className="text-xs" style={{ color: 'var(--color-accent-dark)' }}>{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm transition-colors"
          style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}
        >Cancel</button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
          style={{ background: 'var(--color-blue-base)', color: '#fff' }}
        >{saving ? 'Saving…' : existing ? 'Save changes' : 'Add'}</button>
      </div>
    </div>
  );
}

export function MedicationsPopup({ medications, onSave, onDelete, onClose }: Props) {
  const [adding,        setAdding]        = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try { await onDelete(id); setConfirmDelete(null); } finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative rounded-2xl w-full mx-4 sm:max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: '#FFFFFF', boxShadow: '0 8px 40px rgba(46,40,32,0.18)', borderLeft: '4px solid var(--color-accent)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Medications & Birth Control</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>Current medications, supplements, and contraceptives</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none p-1" style={{ color: 'var(--color-peat-deep)' }}>×</button>
        </div>

        <div className="px-5 py-5 space-y-3" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>

          {/* Existing list */}
          {medications.length > 0 && (
            <div className="space-y-2">
              {medications.map(med => {
                const tc = TYPE_COLORS[med.type];
                if (editingId === med.id) {
                  return (
                    <div key={med.id} className="rounded-xl p-3" style={{ border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)' }}>
                      <MedForm
                        existing={med}
                        onSave={async (data) => { await onSave(data); setEditingId(null); }}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  );
                }
                return (
                  <div key={med.id} className="rounded-xl px-3 py-2.5 flex items-start justify-between gap-3" style={{ background: 'var(--color-peat-light)', border: '1px solid var(--color-peat-mid)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{med.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.color }}>
                          {TYPE_LABELS.find(t => t.value === med.type)?.label}
                        </span>
                      </div>
                      {(med.dose || med.frequency) && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>
                          {[med.dose, med.frequency].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {(med.start_date || med.end_date) && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>
                          {med.start_date ?? '?'}{' – '}{med.end_date ?? 'ongoing'}
                        </p>
                      )}
                      {med.notes && <p className="text-xs mt-0.5 italic" style={{ color: 'var(--color-peat-deep)' }}>{med.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {confirmDelete === med.id ? (
                        <>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 rounded-lg"
                            style={{ background: 'var(--color-peat-mid)', color: 'var(--color-peat-deep)' }}
                          >Cancel</button>
                          <button
                            onClick={() => handleDelete(med.id)}
                            disabled={deleting}
                            className="text-xs px-2 py-1 rounded-lg disabled:opacity-60"
                            style={{ background: 'var(--color-accent)', color: '#fff' }}
                          >{deleting ? '…' : 'Delete'}</button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingId(med.id)}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)' }}
                          >Edit</button>
                          <button
                            onClick={() => setConfirmDelete(med.id)}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}
                          >Remove</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {medications.length === 0 && !adding && (
            <p className="text-sm py-2" style={{ color: 'var(--color-peat-deep)' }}>No medications logged yet.</p>
          )}

          {/* Add form */}
          {adding ? (
            <div className="rounded-xl p-3" style={{ border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New entry</p>
              <MedForm
                onSave={async (data) => { await onSave(data); setAdding(false); }}
                onCancel={() => setAdding(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--color-blue-base)', color: '#fff' }}
            >+ Add medication</button>
          )}
        </div>
      </div>
    </div>
  );
}
