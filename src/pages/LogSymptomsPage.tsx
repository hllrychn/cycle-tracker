import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogSymptomsForm } from '../components/symptoms/LogSymptomsForm';
import { useSymptoms } from '../hooks/useSymptoms';
import { useCycles } from '../hooks/useCycles';
import { usePredictions } from '../hooks/usePredictions';
import { useSettings } from '../hooks/useSettings';
import { useMedications } from '../hooks/useMedications';
import { useMedicationLogs } from '../hooks/useMedicationLogs';
import { isMedicationDueOnDate } from '../services/medicationService';
import { toISODate, differenceInDays, addDays, parseISO, startOfToday } from '../lib/dateUtils';
import type { SymptomLog } from '../types';
import { PixelLoader } from '../components/ui/PixelLoader';

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

export function LogSymptomsPage() {
  const { symptoms, loading: symptomsLoading, logSymptoms } = useSymptoms();
  const { cycles, addOrUpdateCycle, removeCycle } = useCycles();
  const { resetDelay } = useSettings();
  const prediction = usePredictions(cycles, {});
  const navigate = useNavigate();
  const today = toISODate(new Date());
  const { medications } = useMedications();
  const activeMedications = medications.filter(m =>
    m.active &&
    (m.start_date == null || m.start_date <= today) &&
    (m.end_date == null || m.end_date >= today) &&
    isMedicationDueOnDate(m.frequency, m.start_date, today)
  );
  const { takenIds, toggle: toggleMedication } = useMedicationLogs(today);
  const [starting, setStarting]               = useState(false);
  const [startError, setStartError]           = useState<string | null>(null);
  const [dismissed, setDismissed]             = useState(false);
  const [ending, setEnding]                   = useState(false);
  const [endError, setEndError]               = useState<string | null>(null);
  const [dismissedEnd, setDismissedEnd]       = useState(() => isEndDismissed());
  const [delaying, setDelaying]               = useState(false);
  const [delayError, setDelayError]           = useState<string | null>(null);
  const [dismissedDelay, setDismissedDelay]   = useState(false);

  const existing = symptoms.find(s => s.log_date === today) ?? null;

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

  const handleEndPeriod = async () => {
    if (!latestPeriod) return;
    setEnding(true);
    setEndError(null);
    try {
      await addOrUpdateCycle({ start_date: latestPeriod.start_date, end_date: today, flow: latestPeriod.flow, notes: latestPeriod.notes });
      navigate('/');
    } catch (e) {
      setEndError((e as Error).message);
    } finally {
      setEnding(false);
    }
  };

  const handleDelayCurrentPeriod = async () => {
    if (!latestPeriod) return;
    setDelaying(true);
    setDelayError(null);
    try {
      const newStart = toISODate(addDays(parseISO(latestPeriod.start_date), 1));
      const newEnd = latestPeriod.end_date
        ? toISODate(addDays(parseISO(latestPeriod.end_date), 1))
        : null;
      await removeCycle(latestPeriod.id);
      await addOrUpdateCycle(
        { start_date: newStart, end_date: newEnd, flow: latestPeriod.flow, notes: latestPeriod.notes },
        { excludeId: latestPeriod.id },
      );
      navigate('/');
    } catch (e) {
      setDelayError((e as Error).message);
    } finally {
      setDelaying(false);
    }
  };

  const handleSubmit = async (data: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await logSymptoms(data);
    navigate('/');
  };

  const handleStartToday = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const todayDate = new Date();
      const nextLogged = [...cycles]
        .filter(c => c.start_date > today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null;

      if (nextLogged) {
        const duration = nextLogged.end_date
          ? differenceInDays(parseISO(nextLogged.end_date), parseISO(nextLogged.start_date))
          : null;
        await removeCycle(nextLogged.id);
        await addOrUpdateCycle(
          {
            start_date: today,
            end_date: duration != null ? toISODate(addDays(todayDate, duration)) : null,
            flow: nextLogged.flow,
            notes: nextLogged.notes,
          },
          { excludeId: nextLogged.id },
        );
      } else {
        await addOrUpdateCycle({ start_date: today, flow: 'medium' });
      }
      resetDelay();
      navigate('/');
    } catch (e) {
      setStartError((e as Error).message);
    } finally {
      setStarting(false);
    }
  };

  const daysUntilNext = prediction ? differenceInDays(prediction.nextPeriodStart, startOfToday()) : null;
  const isEarly = daysUntilNext !== null && daysUntilNext > 0;

  // Compute current phase to gate the banner
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

  if (symptomsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <PixelLoader size={56} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="font-semibold mb-6 text-3xl md:text-[38px]" style={{ color: 'var(--color-text-primary)' }}>
        {existing ? "Update today's symptoms" : 'Log symptoms'}
      </h1>

      {isDay1OfPeriod && !dismissedDelay && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-phase-menstrual)', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-peat-deep)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: 'var(--color-peat-deep)' }}>Day 1 of period</p>
            <button
              onClick={() => setDismissedDelay(true)}
              className="text-xs transition-colors"
              style={{ color: 'var(--color-peat-deep)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
            >
              Dismiss
            </button>
          </div>
          <button
            onClick={handleDelayCurrentPeriod}
            disabled={delaying}
            className="w-full py-2 text-sm rounded-lg transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }}
            onMouseEnter={e => { if (!delaying) e.currentTarget.style.background = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-peat-dark)'; }}
          >
            {delaying ? 'Saving…' : 'Not yet — delay 1 day'}
          </button>
          {delayError && <p className="text-xs mt-2" style={{ color: '#C0392B' }}>{delayError}</p>}
        </div>
      )}

      {isDay2PlusOfPeriod && !dismissedEnd && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-phase-menstrual)', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-peat-deep)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: 'var(--color-peat-deep)' }}>Period in progress</p>
            <button
              onClick={() => { setEndDismissed(); setDismissedEnd(true); }}
              className="text-xs transition-colors"
              style={{ color: 'var(--color-peat-deep)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
            >
              Dismiss
            </button>
          </div>
          <button
            onClick={handleEndPeriod}
            disabled={ending}
            className="w-full py-2 text-sm rounded-lg transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }}
            onMouseEnter={e => { if (!ending) e.currentTarget.style.background = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-peat-dark)'; }}
          >
            {ending ? 'Saving…' : 'End period today'}
          </button>
          {endError && <p className="text-xs mt-2" style={{ color: '#C0392B' }}>{endError}</p>}
        </div>
      )}

      {!hasActivePeriod && prediction && isLuteal && !dismissed && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-phase-menstrual)', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
              {isEarly ? `Next period expected in ${daysUntilNext} day${daysUntilNext === 1 ? '' : 's'}` : 'Period expected today or late'}
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs transition-colors"
              style={{ color: 'var(--color-peat-deep)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
            >
              Dismiss
            </button>
          </div>
          <button
            onClick={handleStartToday}
            disabled={starting}
            className="w-full py-2 text-white text-sm rounded-lg transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-moss-base)' }}
          >
            {starting ? 'Logging…' : isEarly ? 'Period started early' : 'Period started today'}
          </button>
          {startError && <p className="text-xs mt-2" style={{ color: '#C0392B' }}>{startError}</p>}
        </div>
      )}

      <div className="rounded-2xl p-6 overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-mid)' }}>
        <LogSymptomsForm
          existing={existing}
          onSubmit={handleSubmit}
          isOnPeriod={hasActivePeriod}
          medications={activeMedications}
          medicationTakenIds={takenIds}
          onToggleMedication={toggleMedication}
        />
      </div>
    </div>
  );
}
