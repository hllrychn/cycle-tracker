import { useState } from 'react';
import { LogSymptomsForm } from './LogSymptomsForm';
import { toISODate, differenceInDays, addDays, parseISO, startOfToday } from '../../lib/dateUtils';
import type { SymptomLog, Cycle, FlowIntensity } from '../../types';
import type { Prediction } from '../../types';
import type { Medication } from '../../services/medicationService';
import { useMedicationLogs } from '../../hooks/useMedicationLogs';

const END_DISMISS_KEY = 'ct_end_period_dismissed_until';
function isEndDismissed() {
  const v = localStorage.getItem(END_DISMISS_KEY);
  return !!v && Date.now() < parseInt(v, 10);
}
function setEndDismissed() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  localStorage.setItem(END_DISMISS_KEY, String(d.getTime()));
}

interface Props {
  symptoms: SymptomLog[];
  cycles: Cycle[];
  prediction: Prediction | null;
  medications: Medication[];
  onLogSymptoms: (data: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onAddOrUpdateCycle: (data: { start_date: string; end_date?: string | null; flow: FlowIntensity; notes?: string | null }, opts?: { excludeId?: string }) => Promise<unknown>;
  onRemoveCycle: (id: string) => Promise<void>;
  onResetDelay: () => void;
  onClose: () => void;
}

export function LogTodayPopup({ symptoms, cycles, prediction, medications, onLogSymptoms, onAddOrUpdateCycle, onRemoveCycle, onResetDelay, onClose }: Props) {
  const today = toISODate(new Date());
  const existing = symptoms.find(s => s.log_date === today) ?? null;

  const activeMedications = medications.filter(m =>
    m.active &&
    (m.start_date == null || m.start_date <= today) &&
    (m.end_date == null || m.end_date >= today)
  );
  const { takenIds, toggle: toggleMedication } = useMedicationLogs(today);

  const avgDuration = prediction?.avgPeriodDuration ?? 7;
  const latestPeriod = [...cycles]
    .filter(c => c.start_date <= today)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ?? null;

  const isDay1OfPeriod = latestPeriod?.start_date === today;
  const hasActivePeriod = latestPeriod != null && (
    latestPeriod.end_date
      ? latestPeriod.end_date >= today
      : differenceInDays(startOfToday(), parseISO(latestPeriod.start_date)) <= avgDuration
  );
  const isDay2PlusOfPeriod = hasActivePeriod && !isDay1OfPeriod;

  const daysUntilNext = prediction ? differenceInDays(prediction.nextPeriodStart, startOfToday()) : null;
  const isEarly = daysUntilNext !== null && daysUntilNext > 0;

  const latestPastCycle = [...cycles]
    .filter(c => c.start_date <= today)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ?? null;
  const cycleDay = latestPastCycle
    ? differenceInDays(startOfToday(), parseISO(latestPastCycle.start_date)) + 1
    : prediction && daysUntilNext !== null && daysUntilNext >= 0
      ? Math.max(1, prediction.avgCycleLength - daysUntilNext)
      : null;
  const isLuteal = cycleDay !== null && prediction
    ? cycleDay > prediction.avgCycleLength - 11 && cycleDay <= prediction.avgCycleLength
    : false;

  const [starting,      setStarting]      = useState(false);
  const [startError,    setStartError]    = useState<string | null>(null);
  const [dismissed,     setDismissed]     = useState(false);
  const [ending,        setEnding]        = useState(false);
  const [endError,      setEndError]      = useState<string | null>(null);
  const [dismissedEnd,  setDismissedEnd]  = useState(() => isEndDismissed());
  const [delaying,      setDelaying]      = useState(false);
  const [delayError,    setDelayError]    = useState<string | null>(null);
  const [dismissedDelay, setDismissedDelay] = useState(false);
  const [saving,        setSaving]        = useState(false);

  const handleEndPeriod = async () => {
    if (!latestPeriod) return;
    setEnding(true); setEndError(null);
    try {
      await onAddOrUpdateCycle({ start_date: latestPeriod.start_date, end_date: today, flow: latestPeriod.flow, notes: latestPeriod.notes });
      onClose();
    } catch (e) { setEndError((e as Error).message); }
    finally { setEnding(false); }
  };

  const handleDelay = async () => {
    if (!latestPeriod) return;
    setDelaying(true); setDelayError(null);
    try {
      const newStart = toISODate(addDays(parseISO(latestPeriod.start_date), 1));
      const newEnd = latestPeriod.end_date ? toISODate(addDays(parseISO(latestPeriod.end_date), 1)) : null;
      await onRemoveCycle(latestPeriod.id);
      await onAddOrUpdateCycle({ start_date: newStart, end_date: newEnd, flow: latestPeriod.flow, notes: latestPeriod.notes }, { excludeId: latestPeriod.id });
      onClose();
    } catch (e) { setDelayError((e as Error).message); }
    finally { setDelaying(false); }
  };

  const handleStartToday = async () => {
    setStarting(true); setStartError(null);
    try {
      const todayDate = new Date();
      const nextLogged = [...cycles]
        .filter(c => c.start_date > today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null;
      if (nextLogged) {
        const duration = nextLogged.end_date ? differenceInDays(parseISO(nextLogged.end_date), parseISO(nextLogged.start_date)) : null;
        await onRemoveCycle(nextLogged.id);
        await onAddOrUpdateCycle({ start_date: today, end_date: duration != null ? toISODate(addDays(todayDate, duration)) : null, flow: nextLogged.flow, notes: nextLogged.notes }, { excludeId: nextLogged.id });
      } else {
        await onAddOrUpdateCycle({ start_date: today, flow: 'medium' });
      }
      onResetDelay();
      onClose();
    } catch (e) { setStartError((e as Error).message); }
    finally { setStarting(false); }
  };

  const handleSubmit = async (data: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setSaving(true);
    try {
      await onLogSymptoms(data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl flex flex-col"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 8px 40px rgba(46,40,32,0.18)',
          borderLeft: '4px solid var(--color-moss-mid)',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 64px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {existing ? "Update today's log" : 'Log today'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>How are you feeling?</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none p-1" style={{ color: 'var(--color-peat-deep)' }}>×</button>
        </div>

        {/* Scrollable content */}
        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
          {/* Period banners */}
          {isDay1OfPeriod && !dismissedDelay && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--color-phase-menstrual)', borderLeft: '4px solid var(--color-peat-deep)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: 'var(--color-peat-deep)' }}>Day 1 of period</p>
                <button onClick={() => setDismissedDelay(true)} className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Dismiss</button>
              </div>
              <button onClick={handleDelay} disabled={delaying} className="w-full py-2 text-sm rounded-lg disabled:opacity-60" style={{ background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }}>
                {delaying ? 'Saving…' : 'Not yet — delay 1 day'}
              </button>
              {delayError && <p className="text-xs mt-2" style={{ color: '#C0392B' }}>{delayError}</p>}
            </div>
          )}
          {isDay2PlusOfPeriod && !dismissedEnd && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--color-phase-menstrual)', borderLeft: '4px solid var(--color-peat-deep)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: 'var(--color-peat-deep)' }}>Period in progress</p>
                <button onClick={() => { setEndDismissed(); setDismissedEnd(true); }} className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Dismiss</button>
              </div>
              <button onClick={handleEndPeriod} disabled={ending} className="w-full py-2 text-sm rounded-lg disabled:opacity-60" style={{ background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }}>
                {ending ? 'Saving…' : 'End period today'}
              </button>
              {endError && <p className="text-xs mt-2" style={{ color: '#C0392B' }}>{endError}</p>}
            </div>
          )}
          {!hasActivePeriod && prediction && isLuteal && !dismissed && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--color-phase-menstrual)', borderLeft: '4px solid var(--color-accent)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
                  {isEarly ? `Next period expected in ${daysUntilNext} day${daysUntilNext === 1 ? '' : 's'}` : 'Period expected today or late'}
                </p>
                <button onClick={() => setDismissed(true)} className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Dismiss</button>
              </div>
              <button onClick={handleStartToday} disabled={starting} className="w-full py-2 text-white text-sm rounded-lg disabled:opacity-60" style={{ background: 'var(--color-moss-base)' }}>
                {starting ? 'Logging…' : isEarly ? 'Period started early' : 'Period started today'}
              </button>
              {startError && <p className="text-xs mt-2" style={{ color: '#C0392B' }}>{startError}</p>}
            </div>
          )}

          {/* Symptoms form (submit button hidden — handled by sticky footer) */}
          <LogSymptomsForm
            existing={existing}
            onSubmit={handleSubmit}
            isOnPeriod={hasActivePeriod}
            formId="log-today-form"
            hideSubmit
            medications={activeMedications}
            medicationTakenIds={takenIds}
            onToggleMedication={toggleMedication}
          />
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 px-5 py-4" style={{ borderTop: '1px solid var(--color-peat-light)', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          <button
            type="submit"
            form="log-today-form"
            disabled={saving}
            className="w-full py-2 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-moss-base)' }}
          >
            {saving ? 'Saving…' : existing ? 'Update symptoms' : 'Save symptoms'}
          </button>
        </div>
      </div>
    </div>
  );
}
