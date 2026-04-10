import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useCycles } from '../hooks/useCycles';
import { useSymptoms } from '../hooks/useSymptoms';
import { usePredictions } from '../hooks/usePredictions';
import { useSettings } from '../hooks/useSettings';
import { PeriodEntry } from '../components/period/PeriodEntry';
import { SymptomBarChart } from '../components/symptoms/SymptomBarChart';
import { format, parseISO, differenceInDays } from '../lib/dateUtils';
import type { Cycle, SymptomLog, Severity } from '../types';

type Tab = 'periods' | 'symptoms';

// ── Phase helpers ─────────────────────────────────────────────────────────────
type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

const PHASE_META: Record<Phase, { label: string; bg: string; color: string }> = {
  menstrual:  { label: 'Menstrual',  bg: 'var(--color-phase-menstrual)',  color: 'var(--color-text-primary)' },
  follicular: { label: 'Follicular', bg: 'var(--color-phase-follicular)', color: 'var(--color-blue-dark)'    },
  ovulatory:  { label: 'Ovulatory',  bg: 'var(--color-phase-ovulation)',  color: 'var(--color-moss-dark)'    },
  luteal:     { label: 'Luteal',     bg: 'var(--color-phase-luteal)',     color: 'var(--color-peat-deep)'    },
};

function getSymptomPhase(logDate: string, cycles: Cycle[], avgLen: number, avgDur: number): Phase | null {
  const past = cycles.filter(c => c.start_date <= logDate);
  if (past.length === 0) return null;
  const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  const day = differenceInDays(parseISO(logDate), parseISO(latest.start_date)) + 1;
  if (day < 1 || day > avgLen + 7) return null;
  if (day <= avgDur)    return 'menstrual';
  if (day <= avgLen-16) return 'follicular';
  if (day <= avgLen-11) return 'ovulatory';
  if (day <= avgLen)    return 'luteal';
  return null;
}

// ── Severity helpers ──────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<Severity, { bg: string; color: string }> = {
  none:     { bg: 'transparent',                color: 'transparent'                },
  mild:     { bg: 'var(--color-moss-light)',    color: 'var(--color-moss-dark)'     },
  moderate: { bg: 'var(--color-accent-light)',  color: 'var(--color-accent-dark)'   },
  severe:   { bg: 'var(--color-blue-light)',    color: 'var(--color-blue-dark)'     },
};

const SEVERITY_KEYS: (keyof Pick<SymptomLog, 'cramps' | 'bloating' | 'headache' | 'fatigue' | 'breast_tenderness' | 'spotting'>)[] =
  ['cramps', 'bloating', 'headache', 'fatigue', 'breast_tenderness', 'spotting'];

const SEVERITY_LABELS: Record<string, string> = {
  cramps: 'Cramps', bloating: 'Bloating', headache: 'Headache',
  fatigue: 'Fatigue', breast_tenderness: 'Breast', spotting: 'Spotting',
};

// ── Group by month/year ───────────────────────────────────────────────────────
function groupByMonth<T>(items: T[], getDate: (t: T) => string): { label: string; items: T[] }[] {
  const groups: Map<string, T[]> = new Map();
  for (const item of items) {
    const key = getDate(item).slice(0, 7); // YYYY-MM
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries()).map(([key, items]) => ({
    label: format(parseISO(key + '-01'), 'MMMM yyyy'),
    items,
  }));
}

function groupByYear(cycles: Cycle[]): { label: string; cycles: Cycle[] }[] {
  const groups: Map<string, Cycle[]> = new Map();
  for (const c of cycles) {
    const yr = c.start_date.slice(0, 4);
    if (!groups.has(yr)) groups.set(yr, []);
    groups.get(yr)!.push(c);
  }
  return Array.from(groups.entries()).map(([yr, cycles]) => ({ label: yr, cycles }));
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 rounded-xl px-4 py-3" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.06)' }}>
      <p className="text-xs mb-0.5" style={{ color: 'var(--color-peat-deep)' }}>{label}</p>
      <p className="text-xl font-semibold leading-none" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-mid)' }}>{sub}</p>}
    </div>
  );
}

// ── Symptom row ───────────────────────────────────────────────────────────────
function SymptomRow({ log, phase }: { log: SymptomLog; phase: Phase | null }) {
  const severities = SEVERITY_KEYS.filter(k => log[k] !== 'none');
  const otherCount = log.other_symptoms?.length ?? 0;
  const hasContent = severities.length > 0 || !!log.flow_intensity || otherCount > 0 || !!log.discharge || !!log.bowel_movement || log.food_craving != null || !!log.notes;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3"
      style={{ borderBottom: '1px solid var(--color-peat-light)' }}
    >
      {/* Date column */}
      <div className="w-10 shrink-0 text-center pt-0.5">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {format(parseISO(log.log_date), 'd')}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
          {format(parseISO(log.log_date), 'EEE')}
        </p>
      </div>

      {/* Emoji */}
      <div className="w-7 shrink-0 text-xl leading-none pt-0.5">
        {log.feeling_emoji ?? ''}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {!hasContent ? (
          <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>No symptoms recorded</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {log.flow_intensity && (
              <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'var(--color-phase-menstrual)', color: 'var(--color-text-primary)' }}>
                Flow: {log.flow_intensity}
              </span>
            )}
            {severities.map(k => {
              const val = log[k] as Severity;
              const s = SEVERITY_STYLE[val];
              return (
                <span key={k} className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: s.bg, color: s.color }}>
                  {SEVERITY_LABELS[k]} · {val}
                </span>
              );
            })}
            {log.discharge && (
              <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'var(--color-peat-mid)', color: 'var(--color-peat-dark)' }}>
                Discharge: {log.discharge}
              </span>
            )}
            {log.bowel_movement && (
              <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)' }}>
                Bowel: {log.bowel_movement}
              </span>
            )}
            {log.food_craving != null && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}>
                Cravings: {log.food_craving ? 'Yes' : 'No'}
              </span>
            )}
            {otherCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-peat-mid)', color: 'var(--color-peat-dark)' }}>
                +{otherCount} other{otherCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
        {log.notes && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-peat-deep)' }}>{log.notes}</p>
        )}
      </div>

      {/* Phase badge */}
      {phase && (
        <span className="text-xs px-2 py-0.5 rounded-full shrink-0 self-start mt-0.5" style={{ background: PHASE_META[phase].bg, color: PHASE_META[phase].color }}>
          {PHASE_META[phase].label}
        </span>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function HistoryPage() {
  const [tab, setTab] = useState<Tab>('periods');

  const currentYear  = new Date().getFullYear().toString();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [collapsedYears,  setCollapsedYears]  = useState<Set<string>>(new Set());
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  const toggleYear  = (yr: string)  => setCollapsedYears(s  => { const n = new Set(s); n.has(yr)  ? n.delete(yr)  : n.add(yr);  return n; });
  const toggleMonth = (mo: string)  => setCollapsedMonths(s => { const n = new Set(s); n.has(mo)  ? n.delete(mo)  : n.add(mo);  return n; });

  const isYearCollapsed  = (yr: string) => collapsedYears.has(yr)  && yr  !== currentYear;
  const isMonthCollapsed = (mo: string) => collapsedMonths.has(mo) && mo  !== currentMonth;

  const { cycles, loading: cyclesLoading, removeCycle, addOrUpdateCycle } = useCycles();
  const { symptoms, loading: symptomsLoading } = useSymptoms();
  const { customCycleLength, customPeriodDuration, nextPeriodDelayDays, resetDelay, setCustomCycleLength, setCustomPeriodDuration } = useSettings();
  const prediction = usePredictions(cycles, { customCycleLength, customPeriodDuration, delayDays: nextPeriodDelayDays });

  if (cyclesLoading || symptomsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: 'var(--color-peat-mid)' }} />
        ))}
      </div>
    );
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const pastCycles = [...cycles]
    .filter(c => c.start_date <= todayISO)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  const nextPeriodISO  = prediction ? format(prediction.nextPeriodStart, 'yyyy-MM-dd') : null;
  const daysUntilNext  = prediction ? differenceInDays(prediction.nextPeriodStart, new Date()) : null;

  const avgLen = prediction?.avgCycleLength    ?? 28;
  const avgDur = prediction?.avgPeriodDuration ?? 5;

  // Stats
  const cycleLengths = pastCycles.slice(0, -1).map((_c, i) =>
    differenceInDays(parseISO(pastCycles[i === 0 ? 0 : i].start_date), parseISO(pastCycles[i + 1].start_date))
  ).filter(n => n > 0);

  const periodDurations = pastCycles
    .filter(c => c.end_date)
    .map(c => differenceInDays(parseISO(c.end_date!), parseISO(c.start_date)) + 1);

  const avgCycleDisplay  = prediction ? `${prediction.avgCycleLength}d` : '—';
  const avgPeriodDisplay = prediction ? `${prediction.avgPeriodDuration}d` : '—';

  // Symptoms sorted newest first
  const sortedSymptoms = [...symptoms].sort((a, b) => b.log_date.localeCompare(a.log_date));
  const symptomMonths  = groupByMonth(sortedSymptoms, s => s.log_date);
  const periodYears    = groupByYear(pastCycles);

  if (cycles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-sm mb-4" style={{ color: 'var(--color-peat-deep)' }}>No periods logged yet.</p>
        <NavLink to="/log/period" className="inline-block px-4 py-2 text-white text-sm font-medium rounded-xl" style={{ background: 'var(--color-moss-base)' }}>
          Log your first period
        </NavLink>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>History</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Symptom bar chart */}
      <SymptomBarChart symptoms={symptoms} />

      {/* Stats strip */}
      <div className="flex gap-3">
        <StatCard label="Periods logged"  value={String(pastCycles.length)} />
        <StatCard label="Avg cycle"       value={avgCycleDisplay}  sub={cycleLengths.length > 1 ? `${cycleLengths.length} cycles` : undefined} />
        <StatCard label="Avg period"      value={avgPeriodDisplay} sub={periodDurations.length > 0 ? `${periodDurations.length} recorded` : undefined} />
      </div>

      {/* Tab card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-phase-menstrual)' }}>
        {/* Tab switcher */}
        <div className="p-2" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
          <div className="flex rounded-xl p-1" style={{ background: 'var(--color-peat-light)' }}>
            {(['periods', 'symptoms'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium capitalize"
                style={tab === t
                  ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }
                  : { color: 'var(--color-peat-deep)' }
                }
              >
                {t === 'periods' ? `Periods (${pastCycles.length})` : `Symptoms (${symptoms.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Periods tab ── */}
        {tab === 'periods' && (
          <div>
            {/* Upcoming predicted */}
            {prediction && nextPeriodISO && (
              <div className="px-4 py-3 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--color-peat-light)', background: 'var(--color-phase-menstrual)', opacity: 0.9 }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--color-peat-deep)' }}>Predicted</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {format(parseISO(nextPeriodISO), 'MMM d, yyyy')}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
                      {daysUntilNext === 0 ? 'Expected today' : daysUntilNext! < 0 ? `${Math.abs(daysUntilNext!)}d late` : `in ${daysUntilNext}d`}
                    </span>
                    {nextPeriodDelayDays > 0 && (
                      <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>(+{nextPeriodDelayDays}d delayed)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {(nextPeriodDelayDays > 0 || customCycleLength || customPeriodDuration) && (
                    <button
                      onClick={() => { resetDelay(); setCustomCycleLength(null); setCustomPeriodDuration(null); }}
                      className="text-xs" style={{ color: 'var(--color-peat-deep)' }}
                    >
                      Clear
                    </button>
                  )}
                  <NavLink to="/log/period" className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>
                    Log actual →
                  </NavLink>
                </div>
              </div>
            )}

            {/* Grouped by year */}
            {periodYears.map(({ label: yr, cycles: yc }) => {
              const collapsed = isYearCollapsed(yr);
              return (
                <div key={yr}>
                  <button
                    onClick={() => toggleYear(yr)}
                    className="w-full px-4 py-1.5 flex items-center justify-between"
                    style={{ background: 'var(--color-peat-light)', borderBottom: '1px solid var(--color-peat-mid)' }}
                  >
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-peat-deep)' }}>{yr}</span>
                    <span className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>
                      {collapsed ? `${yc.length} period${yc.length > 1 ? 's' : ''} ›` : '›'}
                    </span>
                  </button>
                  {!collapsed && yc.map((cycle, i) => {
                    const allPast = pastCycles;
                    const globalIdx = allPast.findIndex(c => c.id === cycle.id);
                    const nextCycleStart = globalIdx === 0
                      ? (nextPeriodISO ?? undefined)
                      : allPast[globalIdx - 1]?.start_date;
                    return (
                      <div key={cycle.id} style={{ borderBottom: i < yc.length - 1 ? '1px solid var(--color-peat-light)' : undefined }}>
                        <PeriodEntry
                          cycle={cycle}
                          nextCycleStart={nextCycleStart}
                          onDelete={removeCycle}
                          onEdit={async (data, opts) => { await addOrUpdateCycle(data, opts); }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {pastCycles.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>No past periods logged.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Symptoms tab ── */}
        {tab === 'symptoms' && (
          <div>
            {sortedSymptoms.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs mb-3" style={{ color: 'var(--color-peat-deep)' }}>No symptoms logged yet.</p>
                <NavLink to="/log/symptoms" className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-moss-base)', color: 'white' }}>
                  Log symptoms
                </NavLink>
              </div>
            ) : (
              symptomMonths.map(({ label: month, items }) => {
                const monthKey = items[0].log_date.slice(0, 7);
                const collapsed = isMonthCollapsed(monthKey);
                return (
                  <div key={month}>
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full px-4 py-1.5 flex items-center justify-between"
                      style={{ background: 'var(--color-peat-light)', borderBottom: '1px solid var(--color-peat-mid)' }}
                    >
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-peat-deep)' }}>{month}</span>
                      <span className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>
                        {collapsed ? `${items.length} log${items.length > 1 ? 's' : ''} ›` : `${items.length} log${items.length > 1 ? 's' : ''}`}
                      </span>
                    </button>
                    {!collapsed && items.map(log => (
                      <SymptomRow
                        key={log.id}
                        log={log}
                        phase={getSymptomPhase(log.log_date, cycles, avgLen, avgDur)}
                      />
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
