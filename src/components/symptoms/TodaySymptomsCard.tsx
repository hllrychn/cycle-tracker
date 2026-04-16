import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import type { SymptomLog, Severity, Prediction } from '../../types';
import { format, differenceInDays, startOfToday } from '../../lib/dateUtils';

interface Props {
  symptomLog: SymptomLog | null;
  prediction: Prediction | null;
}

const SEVERITY_LABELS: { key: keyof Pick<SymptomLog, 'mood' | 'cramps' | 'bloating' | 'headache' | 'fatigue' | 'breast_tenderness' | 'spotting'>; label: string }[] = [
  { key: 'mood',              label: 'Mood'              },
  { key: 'cramps',            label: 'Cramps'            },
  { key: 'bloating',          label: 'Bloating'          },
  { key: 'headache',          label: 'Headache'          },
  { key: 'fatigue',           label: 'Fatigue'           },
  { key: 'breast_tenderness', label: 'Breast tenderness' },
  { key: 'spotting',          label: 'Spotting'          },
];

const SEVERITY_STYLE: Record<Severity, { bg: string; color: string }> = {
  none:     { bg: 'var(--color-peat-light)',   color: 'var(--color-peat-deep)'  },
  mild:     { bg: 'var(--color-moss-light)',   color: 'var(--color-moss-dark)'  },
  moderate: { bg: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' },
  severe:   { bg: 'var(--color-blue-light)',   color: 'var(--color-blue-dark)'  },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
      <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
      {children}
    </div>
  );
}

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

type Tab = 'symptoms' | 'predictions';

export function TodaySymptomsCard({ symptomLog, prediction }: Props) {
  const [tab, setTab] = useState<Tab>('symptoms');

  const hasAnything = symptomLog && (
    SEVERITY_LABELS.some(s => symptomLog[s.key] !== 'none') ||
    !!symptomLog.flow_intensity ||
    !!symptomLog.discharge ||
    !!symptomLog.sleep_quality ||
    !!symptomLog.bowel_movement ||
    symptomLog.food_craving != null ||
    (symptomLog.other_symptoms?.length ?? 0) > 0 ||
    !!symptomLog.feeling_emoji ||
    symptomLog.bbt != null ||
    !!symptomLog.notes
  );

  const daysUntil = prediction ? differenceInDays(prediction.nextPeriodStart, startOfToday()) : null;
  const confLabel = prediction
    ? `${prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} confidence`
    : null;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-phase-menstrual)' }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-0" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Today</p>
          {symptomLog?.feeling_emoji && tab === 'symptoms' && (
            <span className="text-2xl leading-none">{symptomLog.feeling_emoji}</span>
          )}
        </div>
        {/* Tabs */}
        <div className="flex gap-4">
          {(['symptoms', 'predictions'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-2 text-xs font-medium capitalize transition-colors"
              style={{
                color: tab === t ? 'var(--color-text-primary)' : 'var(--color-peat-deep)',
                borderBottom: tab === t ? '2px solid var(--color-text-primary)' : '2px solid transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5">
        {tab === 'symptoms' && (
          !hasAnything ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-3">
              <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>No symptoms logged for today.</p>
              <NavLink
                to="/log/symptoms"
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'var(--color-moss-base)', color: 'white' }}
              >
                Log symptoms
              </NavLink>
            </div>
          ) : (
            <div className="pt-1">
              {SEVERITY_LABELS.map(({ key, label }) => {
                const val = symptomLog![key] as Severity;
                if (val === 'none') return null;
                const s = SEVERITY_STYLE[val];
                return (
                  <Row key={key} label={label}>
                    <Badge bg={s.bg} color={s.color}>{val}</Badge>
                  </Row>
                );
              })}

              {symptomLog?.bbt != null && (
                <Row label="Basal body temp.">
                  <Badge bg="var(--color-peat-light)" color="var(--color-peat-dark)">
                    {symptomLog.bbt}°
                  </Badge>
                </Row>
              )}

              {symptomLog?.flow_intensity && (
                <Row label="Flow intensity">
                  <Badge bg="var(--color-phase-menstrual)" color="var(--color-text-primary)">
                    {symptomLog.flow_intensity}
                  </Badge>
                </Row>
              )}

              {symptomLog?.discharge && (
                <Row label="Discharge">
                  <Badge bg="var(--color-peat-mid)" color="var(--color-peat-dark)">{symptomLog.discharge}</Badge>
                </Row>
              )}

              {symptomLog?.sleep_quality && (
                <Row label="Sleep quality">
                  <Badge bg="var(--color-blue-light)" color="var(--color-blue-dark)">{symptomLog.sleep_quality}</Badge>
                </Row>
              )}

              {symptomLog?.bowel_movement && (
                <Row label="Bowel movements">
                  <Badge bg="var(--color-moss-light)" color="var(--color-moss-dark)">{symptomLog.bowel_movement}</Badge>
                </Row>
              )}

              {symptomLog?.food_craving != null && (
                <Row label="Food cravings">
                  <div className="text-right">
                    <Badge bg="var(--color-accent-light)" color="var(--color-accent-dark)">
                      {symptomLog.food_craving ? 'Yes' : 'No'}
                    </Badge>
                    {symptomLog.food_craving && symptomLog.food_craving_notes && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>{symptomLog.food_craving_notes}</p>
                    )}
                  </div>
                </Row>
              )}

              {(symptomLog?.other_symptoms?.length ?? 0) > 0 && (
                <div className="py-2" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--color-peat-deep)' }}>Other symptoms</p>
                  <div className="flex flex-wrap gap-1">
                    {symptomLog!.other_symptoms!.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-peat-mid)', color: 'var(--color-peat-dark)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {symptomLog?.notes && (
                <p className="text-xs py-2" style={{ color: 'var(--color-peat-deep)', borderBottom: '1px solid var(--color-peat-light)' }}>
                  {symptomLog.notes}
                </p>
              )}
            </div>
          )
        )}

        {tab === 'predictions' && (
          !prediction ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Log at least one period to see predictions.</p>
            </div>
          ) : (
            <div className="pt-2 space-y-1">
              {confLabel && (
                <div className="pb-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}>
                    {confLabel}
                  </span>
                </div>
              )}

              {/* Date tiles */}
              <div className="grid grid-cols-2 gap-2 pb-2">
                <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--color-phase-menstrual)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-peat-deep)' }}>Next period</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {format(prediction.nextPeriodStart, 'MMM d')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>
                    {daysUntil! < 0
                      ? `${Math.abs(daysUntil!)}d late`
                      : daysUntil === 0
                      ? 'Today'
                      : `in ${daysUntil}d`}
                  </p>
                </div>
                <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--color-phase-follicular)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--color-blue-dark)' }}>Ovulation</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {format(prediction.ovulationDay, 'MMM d')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-blue-dark)' }}>
                    {format(prediction.fertileWindowStart, 'MMM d')} – {format(prediction.fertileWindowEnd, 'MMM d')}
                  </p>
                </div>
              </div>

              <Row label="Cycle length">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{prediction.avgCycleLength}d</span>
              </Row>
              <Row label="Period length">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{prediction.avgPeriodDuration}d</span>
              </Row>
              <Row label="Fertile window">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {format(prediction.fertileWindowStart, 'MMM d')} – {format(prediction.fertileWindowEnd, 'MMM d')}
                </span>
              </Row>
            </div>
          )
        )}
      </div>

      {/* Footer */}
      {tab === 'symptoms' && hasAnything && (
        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
          <NavLink
            to="/log/symptoms"
            className="block w-full text-center text-xs py-1.5 rounded-lg transition-colors"
            style={{ border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-light)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Update symptoms
          </NavLink>
        </div>
      )}
      {tab === 'predictions' && prediction && (
        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--color-peat-light)' }}>
          <p className="text-xs" style={{ color: 'var(--color-peat-mid)' }}>Estimates only — not medical advice.</p>
        </div>
      )}
    </div>
  );
}
