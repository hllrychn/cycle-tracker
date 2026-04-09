import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { SparkleCursor } from '../cursor/SparkleCursor';
import { useAuth } from '../../hooks/useAuth';
import { useCycles } from '../../hooks/useCycles';
import { useSymptoms } from '../../hooks/useSymptoms';
import { usePredictions } from '../../hooks/usePredictions';
import { useSettings } from '../../hooks/useSettings';
import { differenceInDays, parseISO, format, toISODate, startOfToday } from '../../lib/dateUtils';

function getPhase(cycleDay: number, avgCycleLength: number, avgPeriodDuration: number) {
  if (cycleDay <= avgPeriodDuration)    return 'Menstrual';
  if (cycleDay <= avgCycleLength - 16)  return 'Follicular';
  if (cycleDay <= avgCycleLength - 11)  return 'Ovulatory';
  if (cycleDay <= avgCycleLength)       return 'Luteal';
  return null;
}

const PHASE_COLORS: Record<string, string> = {
  Menstrual:  'var(--color-phase-menstrual)',
  Follicular: 'var(--color-blue-base)',
  Ovulatory:  'var(--color-phase-ovulation)',
  Luteal:     'var(--color-phase-luteal)',
};

const NAV_ITEMS = [
  { to: '/',              label: 'Dashboard',    end: true  },
  { to: '/health',       label: 'Health',       end: false },
  { to: '/log/period',   label: 'Log Period',   end: false },
  { to: '/log/symptoms', label: 'Log Symptoms', end: false },
  { to: '/history',      label: 'History',      end: false },
];

export function AppShell() {
  const { signOut } = useAuth();
  const navigate    = useNavigate();
  const { cycles }  = useCycles();
  const { symptoms } = useSymptoms();
  const { customCycleLength, customPeriodDuration, nextPeriodDelayDays } = useSettings();
  const prediction  = usePredictions(cycles, { customCycleLength, customPeriodDuration, delayDays: nextPeriodDelayDays });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const todayISO = toISODate(new Date());
  const latestCycle = cycles.length > 0
    ? [...cycles]
        .filter(c => c.start_date <= todayISO)
        .sort((a, b) => b.start_date.localeCompare(a.start_date))[0] ?? null
    : null;

  const cycleDay = latestCycle
    ? differenceInDays(startOfToday(), parseISO(latestCycle.start_date)) + 1
    : prediction
      ? Math.max(1, prediction.avgCycleLength - differenceInDays(prediction.nextPeriodStart, startOfToday()))
      : null;

  const phase = cycleDay && prediction
    ? getPhase(cycleDay, prediction.avgCycleLength, prediction.avgPeriodDuration)
    : null;

  const phaseColor    = phase ? PHASE_COLORS[phase] : null;
  const nextPeriodDate = prediction ? format(prediction.nextPeriodStart, 'MMM d') : null;
  const daysUntilNext  = prediction
    ? differenceInDays(prediction.nextPeriodStart, startOfToday())
    : null;

  const todayMood = symptoms.find(s => s.log_date === todayISO)?.feeling_emoji ?? null;

  const divider = '1px solid rgba(255,255,255,0.08)';

  return (
    <div className="flex flex-col min-h-screen">
      <SparkleCursor />

      {/* ── Top header ── */}
      <header
        style={{
          background: 'rgba(46, 40, 32, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: divider,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Phase strip across very top */}
        <div className="flex h-0.5">
          {(['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'] as const).map(p => (
            <div
              key={p}
              className="flex-1 transition-opacity"
              style={{ background: PHASE_COLORS[p], opacity: phase === p ? 1 : 0.25 }}
            />
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-4 flex items-center gap-3 h-14">
          {/* Brand */}
          <span
            className="text-xs font-semibold tracking-widest uppercase shrink-0"
            style={{ color: 'var(--color-moss-base)' }}
          >
            Cycle
          </span>

          {/* Nav — scrollable on mobile */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {NAV_ITEMS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap"
                style={({ isActive }) =>
                  isActive
                    ? { background: 'var(--color-moss-dark)', color: 'var(--color-moss-light)', fontWeight: 500 }
                    : { color: 'var(--color-peat-deep)', fontWeight: 400 }
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1 min-w-0" />

          {/* Cycle day + phase — hidden on mobile */}
          {cycleDay != null && (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Day</span>
              <span
                className="text-sm font-semibold"
                style={{ color: phaseColor ?? 'var(--color-text-light)' }}
              >
                {cycleDay}
              </span>
              {phase && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: phaseColor!, color: 'var(--color-text-primary)' }}
                >
                  {phase}
                </span>
              )}
            </div>
          )}

          {/* Next period — hidden on mobile */}
          {nextPeriodDate && (
            <div
              className="hidden sm:flex items-center gap-1.5 shrink-0 pl-4"
              style={{ borderLeft: divider }}
            >
              <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Next</span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-blue-base)' }}>
                {nextPeriodDate}
              </span>
              {daysUntilNext !== null && daysUntilNext >= 0 && (
                <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
                  in {daysUntilNext}d
                </span>
              )}
            </div>
          )}

          {/* Today's mood — hidden on mobile */}
          <div
            className="hidden sm:flex items-center gap-2 shrink-0 pl-4"
            style={{ borderLeft: divider }}
          >
            {todayMood ? (
              <span className="text-lg leading-none">{todayMood}</span>
            ) : (
              <NavLink
                to="/log/symptoms"
                className="text-xs transition-colors"
                style={{ color: 'var(--color-peat-deep)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-peat-mid)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
              >
                Log mood
              </NavLink>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="text-xs transition-colors shrink-0 pl-3 sm:pl-4"
            style={{ borderLeft: divider, color: 'var(--color-peat-deep)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-peat-mid)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-peat-deep)')}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main
        className="flex-1"
        style={{
          background: [
            'radial-gradient(ellipse at 0% 0%,    #786B64 0%, transparent 55%)',
            'radial-gradient(ellipse at 100% 0%,  #C9A0C2 0%, transparent 55%)',
            'radial-gradient(ellipse at 100% 100%, #7B5F78 0%, transparent 55%)',
            'radial-gradient(ellipse at 0% 100%,  #2E2820 0%, transparent 60%)',
            'radial-gradient(ellipse at 55% 40%,  #D4CCBC 0%, transparent 45%)',
          ].join(', '),
          backgroundColor: '#786B64',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
