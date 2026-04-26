import { useState } from 'react';
import { useCycles } from '../hooks/useCycles';
import { useSymptoms } from '../hooks/useSymptoms';
import { usePredictions, computeRecurringPeriods } from '../hooks/usePredictions';
import { useSettings } from '../hooks/useSettings';
import { StatsTickerStrip } from '../components/predictions/StatsTickerStrip';
import { PredictionsPopup } from '../components/predictions/PredictionsPopup';
import { CycleCheckPopup } from '../components/predictions/CycleCheckPopup';
import { DelayPopup } from '../components/predictions/DelayPopup';
import { EarlyPeriodPopup } from '../components/predictions/EarlyPeriodPopup';
import { CycleCalendar } from '../components/calendar/CycleCalendar';
import { HoroscopeCard } from '../components/horoscope/HoroscopeCard';
import { MakeTodayBetterCard } from '../components/horoscope/MakeTodayBetterCard';
import { SymptomStreakCard } from '../components/symptoms/SymptomStreakCard';
import { FunFactPopup } from '../components/facts/FunFactPopup';
import { NavLink } from 'react-router-dom';
import { differenceInDays, addDays, toISODate, startOfToday, format, parseLocalDate, todayLocalISO } from '../lib/dateUtils';
import { PixelLoader } from '../components/ui/PixelLoader';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentPopup } from '../components/appointments/AppointmentPopup';
import { LogTodayPopup } from '../components/symptoms/LogTodayPopup';

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

export function DashboardPage() {
  const [showFunFact, setShowFunFact]         = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [showAppointment, setShowAppointment] = useState(false);
  const [showLogToday, setShowLogToday]       = useState(false);
  const [dismissedEndBanner, setDismissedEndBanner] = useState(() => isEndDismissed());
  const { cycles, loading: cyclesLoading, addOrUpdateCycle, removeCycle } = useCycles();
  const { symptoms, loading: symptomsLoading, logSymptoms } = useSymptoms();
  const { appointments, saveAppointment, removeAppointment } = useAppointments();
  const {
    customCycleLength, customPeriodDuration, nextPeriodDelayDays, recurringCyclesCount,
    setCustomCycleLength, setCustomPeriodDuration, addDelayDay, setRecurringCyclesCount, resetDelay,
  } = useSettings();

  const handleStartToday = async () => {
    const todayISO = todayLocalISO();
    const nextLogged = [...cycles]
      .filter(c => c.start_date > todayISO)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null;

    if (nextLogged) {
      const duration = nextLogged.end_date
        ? differenceInDays(parseLocalDate(nextLogged.end_date), parseLocalDate(nextLogged.start_date))
        : null;
      await removeCycle(nextLogged.id);
      await addOrUpdateCycle(
        {
          start_date: todayISO,
          end_date: duration != null ? toISODate(addDays(new Date(), duration)) : null,
          flow: nextLogged.flow,
          notes: nextLogged.notes,
        },
        { excludeId: nextLogged.id },
      );
    } else {
      await addOrUpdateCycle({ start_date: todayISO, flow: 'medium' });
    }
    resetDelay();
  };

  const handleDelayOneDay = async () => {
    const todayISO = todayLocalISO();

    // Day 1 of a logged period — shift that period forward
    const todayPeriod = cycles.find(c => c.start_date === todayISO);
    if (todayPeriod) {
      const newStart = toISODate(addDays(parseLocalDate(todayPeriod.start_date), 1));
      const newEnd = todayPeriod.end_date
        ? toISODate(addDays(parseLocalDate(todayPeriod.end_date), 1))
        : null;
      await removeCycle(todayPeriod.id);
      await addOrUpdateCycle(
        { start_date: newStart, end_date: newEnd, flow: todayPeriod.flow, notes: todayPeriod.notes },
        { excludeId: todayPeriod.id },
      );
      return;
    }

    // Shift a future logged period, or add a prediction delay day
    const nextLogged = [...cycles]
      .filter(c => c.start_date > todayISO)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null;

    if (nextLogged) {
      const newStart = toISODate(addDays(parseLocalDate(nextLogged.start_date), 1));
      const newEnd = nextLogged.end_date
        ? toISODate(addDays(parseLocalDate(nextLogged.end_date), 1))
        : null;
      await removeCycle(nextLogged.id);
      await addOrUpdateCycle(
        { start_date: newStart, end_date: newEnd, flow: nextLogged.flow, notes: nextLogged.notes },
        { excludeId: nextLogged.id },
      );
    } else {
      addDelayDay();
    }
  };

  const prediction = usePredictions(cycles, { customCycleLength, customPeriodDuration, delayDays: nextPeriodDelayDays });
  const recurringPeriods = prediction ? computeRecurringPeriods(prediction, recurringCyclesCount) : [];

  const loading = cyclesLoading || symptomsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <PixelLoader size={56} />
      </div>
    );
  }

  const isEmpty = cycles.length === 0;
  const today = new Date();
  const todayISO = todayLocalISO();
  const daysUntilNext = prediction
    ? differenceInDays(prediction.nextPeriodStart, startOfToday())
    : null;
  const isOvulationDay = prediction
    ? format(prediction.ovulationDay, 'yyyy-MM-dd') === todayISO
    : false;

  const latestPeriod = [...cycles]
    .filter(c => c.start_date <= todayISO)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ?? null;
  const avgDuration = prediction?.avgPeriodDuration ?? 7;
  const periodCycleDay = latestPeriod
    ? differenceInDays(startOfToday(), parseLocalDate(latestPeriod.start_date)) + 1
    : null;
  const isDay1OfPeriod = latestPeriod?.start_date === todayISO;
  const isActivePeriodDay2Plus = !isDay1OfPeriod && latestPeriod != null && (
    latestPeriod.end_date
      ? latestPeriod.end_date >= todayISO
      : periodCycleDay !== null && periodCycleDay <= avgDuration
  );

  return (
    <div className="space-y-6">
      {(isOvulationDay || new URLSearchParams(window.location.search).get('preview') === 'cyclecheck') && prediction && (
        <CycleCheckPopup
          nextPeriodStart={prediction.nextPeriodStart}
          forceShow={new URLSearchParams(window.location.search).get('preview') === 'cyclecheck'}
        />
      )}
      {((isDay1OfPeriod || daysUntilNext === 1 || daysUntilNext === 0) || new URLSearchParams(window.location.search).get('preview') === 'delay') && prediction && (
        <DelayPopup
          nextPeriodStart={isDay1OfPeriod ? startOfToday() : prediction.nextPeriodStart}
          onDelayOneDay={handleDelayOneDay}
          startedToday={isDay1OfPeriod}
          forceShow={new URLSearchParams(window.location.search).get('preview') === 'delay'}
        />
      )}
      {(
        (daysUntilNext !== null && daysUntilNext >= 2 && daysUntilNext <= 5) ||
        new URLSearchParams(window.location.search).get('preview') === 'earlyperiod'
      ) && prediction && (
        <EarlyPeriodPopup
          nextPeriodStart={prediction.nextPeriodStart}
          daysUntilNext={daysUntilNext ?? 3}
          onStartToday={handleStartToday}
          forceShow={new URLSearchParams(window.location.search).get('preview') === 'earlyperiod'}
        />
      )}

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-semibold text-3xl md:text-[38px]" style={{ color: 'var(--color-text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-2" style={{ color: '#F0EDE6' }}>
            {format(today, 'EEEE, MMMM d')}
          </p>
        </div>
        {/* Button row — desktop only */}
        <div className="relative hidden md:flex items-center gap-2">
          <button
            onClick={() => setShowFunFact(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}
          >
            <span className="text-base leading-none">💡</span>
            <span style={{ fontSize: '9px', fontWeight: 500, whiteSpace: 'nowrap' }}>Did you know?</span>
          </button>
          <button
            onClick={() => setShowPredictions(p => !p)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors"
            style={showPredictions
              ? { background: 'var(--color-blue-base)', color: '#FFFFFF' }
              : { background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)' }
            }
          >
            <span className="text-base leading-none">📅</span>
            <span style={{ fontSize: '9px', fontWeight: 500, whiteSpace: 'nowrap' }}>Predictions</span>
          </button>
          <button
            onClick={() => setShowAppointment(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors"
            style={{ background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)' }}
          >
            <span className="text-base leading-none">🩺</span>
            <span style={{ fontSize: '9px', fontWeight: 500, whiteSpace: 'nowrap' }}>Appointment</span>
          </button>
          <button
            onClick={() => setShowLogToday(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors font-medium"
            style={{ background: 'var(--color-moss-base)', color: 'white' }}
          >
            <span className="text-base leading-none">✏️</span>
            <span style={{ fontSize: '9px', fontWeight: 500, whiteSpace: 'nowrap' }}>Log today</span>
          </button>
          {showPredictions && (
            <PredictionsPopup
              prediction={prediction}
              customCycleLength={customCycleLength}
              customPeriodDuration={customPeriodDuration}
              delayDays={nextPeriodDelayDays}
              recurringCyclesCount={recurringCyclesCount}
              onSetCycleLength={setCustomCycleLength}
              onSetPeriodDuration={setCustomPeriodDuration}
              onSetRecurringCyclesCount={setRecurringCyclesCount}
              onClose={() => setShowPredictions(false)}
            />
          )}
        </div>
      </div>

      {showFunFact && (
        <FunFactPopup forceShow onClose={() => setShowFunFact(false)} />
      )}

      {showAppointment && (
        <AppointmentPopup
          onSave={async (data) => { await saveAppointment(data); setShowAppointment(false); }}
          onClose={() => setShowAppointment(false)}
        />
      )}

      {showLogToday && (
        <LogTodayPopup
          symptoms={symptoms}
          cycles={cycles}
          prediction={prediction}
          onLogSymptoms={async (data) => { await logSymptoms(data); }}
          onAddOrUpdateCycle={addOrUpdateCycle}
          onRemoveCycle={removeCycle}
          onResetDelay={resetDelay}
          onClose={() => setShowLogToday(false)}
        />
      )}

      {/* Active period day 2+ — end period banner */}
      {isActivePeriodDay2Plus && !dismissedEndBanner && latestPeriod && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-phase-menstrual)', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-peat-deep)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: 'var(--color-peat-deep)' }}>Period in progress</p>
            <button
              onClick={() => { setEndDismissed(); setDismissedEndBanner(true); }}
              className="text-xs transition-colors"
              style={{ color: 'var(--color-peat-deep)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
            >
              Dismiss
            </button>
          </div>
          <button
            onClick={async () => {
              if (!latestPeriod) return;
              await addOrUpdateCycle({ start_date: latestPeriod.start_date, end_date: todayISO, flow: latestPeriod.flow, notes: latestPeriod.notes });
              setEndDismissed(); setDismissedEndBanner(true);
            }}
            className="w-full py-2 text-sm rounded-lg transition-colors"
            style={{ background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-peat-dark)')}
          >
            End period today
          </button>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)' }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Welcome! Start by logging your first period.
          </p>
          <NavLink
            to="/log/period"
            className="inline-block px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors"
            style={{ background: 'var(--color-moss-base)' }}
          >
            Log period
          </NavLink>
        </div>
      )}

      {/* Stats ticker */}
      <StatsTickerStrip
        prediction={prediction}
        totalCycles={cycles.length}
        symptoms={symptoms}
      />

      {/* Button row — mobile only, below ticker */}
      <div className="relative flex md:hidden items-center gap-2">
        <button
          onClick={() => setShowFunFact(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors"
          style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}
        >
          <span className="text-base leading-none">💡</span>
          <span style={{ fontSize: '9px', fontWeight: 500, whiteSpace: 'nowrap' }}>Did you know?</span>
        </button>
        <button
          onClick={() => setShowPredictions(p => !p)}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors"
          style={showPredictions
            ? { background: 'var(--color-blue-base)', color: '#FFFFFF' }
            : { background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)' }
          }
        >
          <span className="text-base leading-none">📅</span>
          <span style={{ fontSize: '9px', fontWeight: 500, whiteSpace: 'nowrap' }}>Predictions</span>
        </button>
        <button
          onClick={() => setShowAppointment(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors"
          style={{ background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)' }}
        >
          <span className="text-base leading-none">🩺</span>
          <span style={{ fontSize: '9px', fontWeight: 500, whiteSpace: 'nowrap' }}>Appointment</span>
        </button>
        <NavLink
          to="/log/symptoms"
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors font-medium"
          style={{ background: 'var(--color-moss-base)', color: 'white' }}
        >
          <span className="text-base leading-none">✏️</span>
          <span style={{ fontSize: '9px', fontWeight: 500, whiteSpace: 'nowrap' }}>Log today</span>
        </NavLink>
        {showPredictions && (
          <PredictionsPopup
            prediction={prediction}
            customCycleLength={customCycleLength}
            customPeriodDuration={customPeriodDuration}
            delayDays={nextPeriodDelayDays}
            recurringCyclesCount={recurringCyclesCount}
            onSetCycleLength={setCustomCycleLength}
            onSetPeriodDuration={setCustomPeriodDuration}
            onSetRecurringCyclesCount={setRecurringCyclesCount}
            onClose={() => setShowPredictions(false)}
          />
        )}
      </div>

      {/* Calendar + symptom streak + make today better */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-stretch">
        <div className="md:col-span-2">
          <CycleCalendar
            cycles={cycles}
            symptoms={symptoms}
            prediction={prediction}
            recurringPeriods={recurringPeriods}
            appointments={appointments}
            onLogSymptoms={async (data) => { await logSymptoms(data); }}
            onSaveAppointment={saveAppointment}
            onDeleteAppointment={removeAppointment}
          />
        </div>
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="grow">
            <SymptomStreakCard symptoms={symptoms} onLogSymptoms={async (data) => { await logSymptoms(data); }} />
          </div>
          <div className="grow">
            <MakeTodayBetterCard cycles={cycles} prediction={prediction} />
          </div>
        </div>
      </div>

      {/* Horoscope */}
      <HoroscopeCard cycles={cycles} prediction={prediction} />

    </div>
  );
}
