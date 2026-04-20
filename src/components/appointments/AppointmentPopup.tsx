import { useState } from 'react';
import type { Appointment } from '../../types';
import type { AppointmentInput } from '../../services/appointmentService';

interface Props {
  existing?: Appointment | null;
  initialDate?: string;
  onSave: (data: AppointmentInput) => Promise<Appointment | void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const inputCls = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-base)]';
const inputStyle = {
  border: '1px solid var(--color-peat-mid)',
  background: 'var(--color-peat-light)',
  color: 'var(--color-text-primary)',
};
const labelStyle = { color: 'var(--color-peat-deep)', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.05em' };

export function AppointmentPopup({ existing, initialDate, onSave, onDelete, onClose }: Props) {
  const [date,     setDate]     = useState(existing?.date     ?? initialDate ?? '');
  const [time,     setTime]     = useState(existing?.time     ?? '');
  const [doctor,   setDoctor]   = useState(existing?.doctor   ?? '');
  const [facility, setFacility] = useState(existing?.facility ?? '');
  const [notes,    setNotes]    = useState(existing?.notes    ?? '');
  const [tests,    setTests]    = useState(existing?.tests    ?? '');
  const [questions, setQuestions] = useState<string[]>(existing?.questions ?? []);
  const [newQuestion, setNewQuestion] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const addQuestion = () => {
    const q = newQuestion.trim();
    if (!q) return;
    setQuestions(prev => [...prev, q]);
    setNewQuestion('');
  };

  const removeQuestion = (i: number) => setQuestions(prev => prev.filter((_, idx) => idx !== i));

  const toggleQuestion = (i: number) => {
    // prefix checked items with ✓ for visual state — not persisted differently
    setQuestions(prev => {
      const next = [...prev];
      next[i] = next[i].startsWith('✓ ') ? next[i].slice(2) : '✓ ' + next[i];
      return next;
    });
  };

  const handleSave = async () => {
    if (!date) { setError('Date is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        id:       existing?.id,
        date,
        time:     time.trim()     || null,
        doctor:   doctor.trim()   || null,
        facility: facility.trim() || null,
        questions,
        notes:    notes.trim()    || null,
        tests:    tests.trim()    || null,
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try { await onDelete(); onClose(); } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: '#FFFFFF', boxShadow: '0 8px 40px rgba(46,40,32,0.18)', borderLeft: '4px solid var(--color-blue-base)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {existing ? 'Edit appointment' : 'Log appointment'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>Doctor visit details</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none p-1" style={{ color: 'var(--color-peat-deep)' }}>×</button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Date + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1" style={labelStyle}>Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block mb-1" style={labelStyle}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} style={inputStyle} />
            </div>
          </div>

          {/* Doctor */}
          <div>
            <label className="block mb-1" style={labelStyle}>Doctor / Provider</label>
            <input
              type="text" value={doctor} onChange={e => setDoctor(e.target.value)}
              placeholder="Dr. Name"
              className={inputCls} style={inputStyle}
            />
          </div>

          {/* Facility */}
          <div>
            <label className="block mb-1" style={labelStyle}>Facility / Clinic</label>
            <input
              type="text" value={facility} onChange={e => setFacility(e.target.value)}
              placeholder="Clinic or hospital name"
              className={inputCls} style={inputStyle}
            />
          </div>

          {/* Questions checklist */}
          <div>
            <label className="block mb-1" style={labelStyle}>Questions / Concerns</label>
            <div className="space-y-1.5 mb-2">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--color-peat-light)' }}>
                  <button
                    onClick={() => toggleQuestion(i)}
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      border: '1.5px solid var(--color-blue-base)',
                      background: q.startsWith('✓ ') ? 'var(--color-blue-base)' : 'transparent',
                      color: '#fff',
                      fontSize: '10px',
                    }}
                  >
                    {q.startsWith('✓ ') ? '✓' : ''}
                  </button>
                  <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)', textDecoration: q.startsWith('✓ ') ? 'line-through' : 'none', opacity: q.startsWith('✓ ') ? 0.5 : 1 }}>
                    {q.startsWith('✓ ') ? q.slice(2) : q}
                  </span>
                  <button onClick={() => removeQuestion(i)} className="text-xs shrink-0" style={{ color: 'var(--color-peat-mid)' }}>✕</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQuestion(); } }}
                placeholder="Add a question or concern…"
                className={`${inputCls} flex-1`}
                style={inputStyle}
              />
              <button
                onClick={addQuestion}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)' }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Tests */}
          <div>
            <label className="block mb-1" style={labelStyle}>Tests / Procedures</label>
            <textarea
              value={tests} onChange={e => setTests(e.target.value)}
              placeholder="e.g. bloodwork, ultrasound, pap smear…"
              rows={2}
              className={`${inputCls} resize-none`} style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-1" style={labelStyle}>Follow-up Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Notes from the visit, follow-up instructions…"
              rows={3}
              className={`${inputCls} resize-none`} style={inputStyle}
            />
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--color-accent-dark)' }}>{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {existing && onDelete && (
              confirmDelete ? (
                <div className="flex gap-2 flex-1">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2 rounded-xl text-sm transition-colors"
                    style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}
                  >Cancel</button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                  >{deleting ? 'Deleting…' : 'Confirm delete'}</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="py-2 px-3 rounded-xl text-sm transition-colors"
                  style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}
                >Delete</button>
              )
            )}
            {!confirmDelete && (
              <button
                onClick={handleSave}
                disabled={saving || !date}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
                style={{ background: 'var(--color-blue-base)', color: '#fff' }}
              >
                {saving ? 'Saving…' : existing ? 'Save changes' : 'Save appointment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
