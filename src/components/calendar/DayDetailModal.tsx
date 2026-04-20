import { useState } from 'react';
import { format } from '../../lib/dateUtils';
import { LogSymptomsForm } from '../symptoms/LogSymptomsForm';
import { AppointmentPopup } from '../appointments/AppointmentPopup';
import type { SymptomLog, Severity, Appointment } from '../../types';
import type { AppointmentInput } from '../../services/appointmentService';
import type { CyclePhase } from './DayCell';

interface Props {
  date: Date;
  symptomLog: SymptomLog | null;
  appointment: Appointment | null;
  phase: CyclePhase | null;
  isLogged: boolean;
  isOvulationDay: boolean;
  onSave: (data: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onSaveAppointment: (data: AppointmentInput) => Promise<Appointment>;
  onDeleteAppointment: () => Promise<void>;
  onClose: () => void;
}

type SeverityKey = 'mood' | 'cramps' | 'bloating' | 'headache' | 'fatigue' | 'breast_tenderness' | 'spotting';

const SYMPTOM_LABELS: { key: SeverityKey; label: string }[] = [
  { key: 'mood',              label: 'Mood' },
  { key: 'cramps',            label: 'Cramps' },
  { key: 'bloating',          label: 'Bloating' },
  { key: 'headache',          label: 'Headache' },
  { key: 'fatigue',           label: 'Fatigue' },
  { key: 'breast_tenderness', label: 'Breast tenderness' },
  { key: 'spotting',          label: 'Spotting' },
];

const severityStyle: Record<Severity, { bg: string; color: string }> = {
  none:     { bg: 'var(--color-peat-light)',   color: 'var(--color-peat-deep)' },
  mild:     { bg: 'var(--color-moss-light)',   color: 'var(--color-moss-dark)' },
  moderate: { bg: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' },
  severe:   { bg: 'var(--color-blue-light)',    color: 'var(--color-blue-dark)'   },
};

function phaseLabel(phase: CyclePhase | null, isLogged: boolean, isOvulationDay: boolean) {
  if (!phase) return null;
  if (isOvulationDay)         return { text: 'Ovulation day',    fill: 'var(--color-phase-ovulation)', color: 'var(--color-moss-dark)' };
  if (phase === 'menstrual')  return isLogged
    ? { text: 'Period',           fill: 'var(--color-phase-menstrual)', color: 'var(--color-text-primary)' }
    : { text: 'Predicted period', fill: 'var(--color-phase-menstrual)', color: 'var(--color-text-primary)' };
  if (phase === 'follicular') return { text: 'Follicular phase', fill: 'var(--color-phase-follicular)', color: 'var(--color-blue-dark)' };
  if (phase === 'ovulatory')  return { text: 'Fertile window',   fill: 'var(--color-phase-ovulation)',  color: 'var(--color-moss-dark)' };
  if (phase === 'luteal')     return { text: 'Luteal phase',     fill: 'var(--color-phase-luteal)',     color: 'var(--color-peat-deep)' };
  return null;
}

export function DayDetailModal({ date, symptomLog, appointment, phase, isLogged, isOvulationDay, onSave, onSaveAppointment, onDeleteAppointment, onClose }: Props) {
  const [editing, setEditing] = useState(!symptomLog);
  const [editingAppt, setEditingAppt] = useState(false);
  const badge = phaseLabel(phase, isLogged, isOvulationDay);

  const handleSave = async (data: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await onSave(data);
    setEditing(false);
    onClose();
  };

  const hasAnySymptom = symptomLog && (
    SYMPTOM_LABELS.some(s => symptomLog[s.key] !== 'none') ||
    !!symptomLog.flow_intensity ||
    !!symptomLog.discharge ||
    !!symptomLog.sleep_quality ||
    !!symptomLog.bowel_movement ||
    symptomLog.food_craving != null ||
    (symptomLog.other_symptoms?.length ?? 0) > 0 ||
    !!symptomLog.feeling_emoji ||
    !!symptomLog.notes
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[85vh] overflow-y-auto"
        style={{ background: '#FFFFFF', boxShadow: '0 8px 40px rgba(46,40,32,0.18)', borderLeft: '4px solid var(--color-blue-base)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--color-peat-mid)' }}>
          <div>
            <h2 className="text-base font-normal" style={{ color: 'var(--color-text-primary)' }}>
              {format(date, 'EEEE, MMMM d')}
            </h2>
            {badge && (
              <span
                className="inline-block mt-1 text-xs font-normal px-2 py-0.5 rounded-full"
                style={{ background: badge.fill, color: badge.color }}
              >
                {badge.text}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none p-1 transition-colors"
            style={{ color: 'var(--color-peat-deep)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
          >
            ×
          </button>
        </div>

        {/* Appointment section */}
        {appointment && !editingAppt && (
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-peat-light)', background: 'var(--color-blue-light)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🩺</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-blue-dark)' }}>Doctor's appointment</p>
                  {appointment.time && <p className="text-xs" style={{ color: 'var(--color-blue-dark)' }}>{appointment.time}</p>}
                  {appointment.reason && <p className="text-xs italic" style={{ color: 'var(--color-blue-dark)' }}>{appointment.reason}</p>}
                  {appointment.doctor && (
                    <p className="text-xs" style={{ color: 'var(--color-blue-dark)' }}>
                      {appointment.doctor}{appointment.doctor_type ? ` · ${appointment.doctor_type}` : ''}
                    </p>
                  )}
                  {appointment.facility && <p className="text-xs" style={{ color: 'var(--color-blue-dark)' }}>{appointment.facility}</p>}
                  {appointment.address && <p className="text-xs" style={{ color: 'var(--color-blue-dark)', opacity: 0.75 }}>{appointment.address}</p>}
                </div>
              </div>
              <button
                onClick={() => setEditingAppt(true)}
                className="text-xs px-2.5 py-1 rounded-lg shrink-0"
                style={{ background: 'var(--color-blue-base)', color: '#fff' }}
              >Edit</button>
            </div>
            {appointment.questions.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-blue-dark)' }}>Questions</p>
                {appointment.questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-blue-dark)' }}>
                    <span style={{ opacity: 0.5 }}>{q.startsWith('✓ ') ? '☑' : '☐'}</span>
                    <span style={{ textDecoration: q.startsWith('✓ ') ? 'line-through' : 'none', opacity: q.startsWith('✓ ') ? 0.5 : 1 }}>
                      {q.startsWith('✓ ') ? q.slice(2) : q}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {appointment.tests && (
              <div className="mt-2">
                <p className="text-xs font-medium" style={{ color: 'var(--color-blue-dark)' }}>Tests</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-blue-dark)' }}>{appointment.tests}</p>
              </div>
            )}
            {appointment.notes && (
              <div className="mt-2">
                <p className="text-xs font-medium" style={{ color: 'var(--color-blue-dark)' }}>Notes</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-blue-dark)' }}>{appointment.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4">
          {editing ? (
            <LogSymptomsForm
              existing={symptomLog ? { ...symptomLog, log_date: format(date, 'yyyy-MM-dd') } : null}
              onSubmit={handleSave}
              initialDate={format(date, 'yyyy-MM-dd')}
              isOnPeriod={phase === 'menstrual' && isLogged}
            />
          ) : (
            <>
              {hasAnySymptom ? (
                <div className="space-y-2 mb-4">
                  {symptomLog?.feeling_emoji && (
                    <div className="flex items-center gap-2 pb-2 mb-2" style={{ borderBottom: '1px solid var(--color-peat-mid)' }}>
                      <span className="text-3xl">{symptomLog.feeling_emoji}</span>
                      <span className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>Feeling</span>
                    </div>
                  )}
                  {SYMPTOM_LABELS.map(({ key, label: symptomLabel }) => {
                    const val = symptomLog![key];
                    if (val === 'none') return null;
                    const s = severityStyle[val];
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>{symptomLabel}</span>
                        <span
                          className="text-xs font-normal px-2.5 py-0.5 rounded-full capitalize"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {val}
                        </span>
                      </div>
                    );
                  })}
                  {symptomLog?.flow_intensity && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>Flow intensity</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full capitalize" style={{ background: 'var(--color-phase-menstrual)', color: 'var(--color-text-primary)' }}>
                        {symptomLog.flow_intensity}
                      </span>
                    </div>
                  )}
                  {symptomLog?.discharge && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>Discharge</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full capitalize" style={{ background: 'var(--color-peat-mid)', color: 'var(--color-peat-dark)' }}>
                        {symptomLog.discharge}
                      </span>
                    </div>
                  )}
                  {symptomLog?.sleep_quality && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>Sleep quality</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full capitalize" style={{ background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)' }}>
                        {symptomLog.sleep_quality}
                      </span>
                    </div>
                  )}
                  {symptomLog?.bowel_movement && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--color-peat-deep)' }}>Bowel movements</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full capitalize" style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)' }}>
                        {symptomLog.bowel_movement}
                      </span>
                    </div>
                  )}
                  {symptomLog?.food_craving != null && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm shrink-0" style={{ color: 'var(--color-peat-deep)' }}>Food cravings</span>
                      <div className="text-right">
                        <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}>
                          {symptomLog.food_craving ? 'Yes' : 'No'}
                        </span>
                        {symptomLog.food_craving && symptomLog.food_craving_notes && (
                          <p className="text-xs mt-1" style={{ color: 'var(--color-peat-deep)' }}>{symptomLog.food_craving_notes}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {(symptomLog?.other_symptoms?.length ?? 0) > 0 && (
                    <div className="pt-1">
                      <span className="text-sm block mb-1.5" style={{ color: 'var(--color-peat-deep)' }}>Additional symptoms</span>
                      <div className="flex flex-wrap gap-1.5">
                        {symptomLog!.other_symptoms!.map(s => (
                          <span
                            key={s}
                            className="text-xs px-2.5 py-0.5 rounded-full"
                            style={{ background: 'var(--color-peat-mid)', color: 'var(--color-peat-dark)' }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {symptomLog?.notes && (
                    <p className="text-xs pt-1 mt-2" style={{ color: 'var(--color-peat-deep)', borderTop: '1px solid var(--color-peat-mid)' }}>
                      {symptomLog.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm mb-4" style={{ color: 'var(--color-peat-deep)' }}>No symptoms logged for this day.</p>
              )}
              <button
                onClick={() => setEditing(true)}
                className="w-full py-2 font-normal rounded-lg text-sm transition-colors"
                style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-light)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {hasAnySymptom ? 'Edit symptoms' : 'Log symptoms'}
              </button>
            </>
          )}
        </div>
      </div>

      {editingAppt && (
        <AppointmentPopup
          existing={appointment ?? undefined}
          initialDate={format(date, 'yyyy-MM-dd')}
          onSave={async (data) => { await onSaveAppointment(data); setEditingAppt(false); }}
          onDelete={appointment ? async () => { await onDeleteAppointment(); setEditingAppt(false); } : undefined}
          onClose={() => setEditingAppt(false)}
        />
      )}
    </div>
  );
}
