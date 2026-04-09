import { useState } from 'react';
import { format, subDays, startOfToday } from '../../lib/dateUtils';
import type { SymptomLog } from '../../types';

interface Props {
  symptoms: SymptomLog[];
  onLogSymptoms: (data: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const QUICK_EMOJIS = [
  '😊', '🥰', '😌', '😐', '😔',
  '😢', '😠', '😰', '🤒', '😴',
  '🥴', '💪', '🔥', '🥳', '✨',
];

function buildDefaultLog(date: string): Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  return {
    log_date:           date,
    mood:               'none',
    cramps:             'none',
    bloating:           'none',
    headache:           'none',
    fatigue:            'none',
    breast_tenderness:  'none',
    spotting:           'none',
    flow_intensity:     null,
    other_symptoms:     null,
    discharge:          null,
    sleep_quality:      null,
    bowel_movement:     null,
    food_craving:       null,
    food_craving_notes: null,
    feeling_emoji:      null,
    notes:              null,
  };
}

function calcStreak(symptoms: SymptomLog[]): number {
  const logged = new Set(symptoms.filter(s => s.feeling_emoji).map(s => s.log_date));
  let streak = 0;
  let cursor = startOfToday();
  while (logged.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function SymptomStreakCard({ symptoms, onLogSymptoms }: Props) {
  const [saving, setSaving] = useState(false);

  const today = startOfToday();
  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  const logMap = new Map(symptoms.map(s => [s.log_date, s]));
  const todayISO = format(today, 'yyyy-MM-dd');
  const todayLog = logMap.get(todayISO) ?? null;
  const streak = calcStreak(symptoms);

  const handleEmoji = async (emoji: string) => {
    if (saving) return;
    setSaving(true);
    try {
      const existing = todayLog;
      const base = existing
        ? { ...existing }
        : buildDefaultLog(todayISO);
      // toggle off if same emoji tapped again
      await onLogSymptoms({ ...base, feeling_emoji: todayLog?.feeling_emoji === emoji ? null : emoji });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--color-peat-light)' }}>
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>How you've felt</p>
          {streak > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)' }}>
              🔥 {streak}d
            </span>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>Last 7 days</p>
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 px-3 py-3 gap-1">
        {days.map(day => {
          const iso = format(day, 'yyyy-MM-dd');
          const log = logMap.get(iso);
          const isToday = iso === todayISO;
          return (
            <div key={iso} className="flex flex-col items-center gap-1">
              <span className="text-xs" style={{ color: isToday ? 'var(--color-moss-base)' : 'var(--color-peat-deep)', fontWeight: isToday ? 600 : 400 }}>
                {format(day, 'EEEEE')}
              </span>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{
                  background: log?.feeling_emoji ? 'var(--color-accent-light)' : 'var(--color-peat-light)',
                  outline: isToday ? '2px solid var(--color-moss-base)' : undefined,
                  outlineOffset: isToday ? '2px' : undefined,
                }}
              >
                {log?.feeling_emoji ?? <span style={{ color: 'var(--color-peat-mid)', fontSize: '10px' }}>·</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick log */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--color-peat-light)', paddingTop: '12px' }}>
        <p className="text-xs mb-2" style={{ color: 'var(--color-peat-deep)' }}>
          {todayLog?.feeling_emoji ? 'Today' : 'Log today'}
          {todayLog?.feeling_emoji && <span className="ml-1.5 text-base leading-none">{todayLog.feeling_emoji}</span>}
        </p>
        <div className="grid grid-cols-5 gap-1">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              disabled={saving}
              onClick={() => handleEmoji(emoji)}
              className="text-lg leading-none p-1 rounded-lg transition-all"
              style={todayLog?.feeling_emoji === emoji
                ? { background: 'var(--color-accent-light)', outline: '2px solid var(--color-accent)', transform: 'scale(1.1)' }
                : undefined
              }
              onMouseEnter={e => { if (todayLog?.feeling_emoji !== emoji) e.currentTarget.style.background = 'var(--color-peat-light)'; }}
              onMouseLeave={e => { if (todayLog?.feeling_emoji !== emoji) e.currentTarget.style.background = 'transparent'; }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
