import { useState } from 'react';
import type { SymptomLog, Severity, DischargeType, BowelMovement, FlowIntensity } from '../../types';
import { toISODate } from '../../lib/dateUtils';

interface Props {
  existing?: SymptomLog | null;
  onSubmit: (data: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialDate?: string;
  isOnPeriod?: boolean;
}

const FLOW_OPTIONS: { value: FlowIntensity; label: string }[] = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light',    label: 'Light'    },
  { value: 'medium',   label: 'Medium'   },
  { value: 'heavy',    label: 'Heavy'    },
];

interface OtherSymptomGroup { label: string; items: string[] }

const OTHER_SYMPTOM_GROUPS: OtherSymptomGroup[] = [
  {
    label: 'Physical',
    items: ['Back pain', 'Joint pain', 'Nausea', 'Dizziness', 'Hot flashes', 'Chills',
            'Water retention', 'Heart palpitations', 'Muscle weakness', 'Pelvic pain', 'Congestion'],
  },
  {
    label: 'Emotional',
    items: ['Brain fog', 'Anxiety', 'Irritability', 'Crying spells', 'Overwhelm',
            'Low libido', 'High libido', 'Difficulty concentrating', 'Low motivation'],
  },
  {
    label: 'Skin & Hair',
    items: ['Acne / breakouts', 'Oily skin', 'Dry skin', 'Hair shedding', 'Skin sensitivity', 'Brittle nails'],
  },
  {
    label: 'Sleep',
    items: ['Insomnia', 'Vivid dreams', 'Oversleeping', 'Early waking', 'Restlessness', 'Night sweats'],
  },
];

const DISCHARGE_OPTIONS: DischargeType[]   = ['dry', 'sticky', 'wet', 'creamy'];
const BOWEL_OPTIONS:     BowelMovement[]   = ['normal', 'constipated', 'loose', 'diarrhea'];

type SymptomsKey = 'cramps' | 'bloating' | 'headache' | 'fatigue' | 'breast_tenderness' | 'spotting';

const SYMPTOMS: { key: SymptomsKey; label: string }[] = [
  { key: 'cramps', label: 'Cramps' },
  { key: 'bloating', label: 'Bloating' },
  { key: 'headache', label: 'Headache' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'breast_tenderness', label: 'Breast tenderness' },
  { key: 'spotting', label: 'Spotting' },
];

const SEVERITIES: Severity[] = ['none', 'mild', 'moderate', 'severe'];

const severityActive: Record<Severity, { bg: string; color: string }> = {
  none:     { bg: 'var(--color-peat-mid)',     color: 'var(--color-peat-dark)'  },
  mild:     { bg: 'var(--color-moss-light)',   color: 'var(--color-moss-dark)'  },
  moderate: { bg: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' },
  severe:   { bg: 'var(--color-blue-light)',    color: 'var(--color-blue-dark)'   },
};

const FEELING_EMOJIS = [
  // Happy / positive
  '😊', '😄', '😁', '🥰', '😍', '🤩', '🥳', '😆', '😸',
  // Calm / content
  '😌', '🤗', '☺️', '🙂', '😇', '🫶', '💆', '🧘', '✨',
  // Neutral / meh
  '😐', '😑', '😶', '😏', '🫤', '🤔', '😒', '🙄', '😶‍🌫️',
  // Sad / low
  '😔', '😞', '😕', '😢', '😭', '😿', '💔', '😓', '🫠',
  // Angry / frustrated
  '😠', '😤', '🤬', '👿', '😾', '🤯', '😖', '😣', '💢',
  // Anxious / overwhelmed
  '😰', '😨', '😧', '😦', '😱', '🫨', '😬', '😟', '🫣',
  // Physical / unwell
  '🤒', '🤢', '🤕', '😵', '😵‍💫', '🥴', '🤧', '🥵', '🥶',
  // Tired / low energy
  '😴', '🥱', '😪', '💤', '🫥', '😫', '😩', '🌧️', '🪫',
  // Energetic / strong
  '💪', '🔥', '⚡', '🌟', '🌈', '🎯', '🚀', '😎', '🫡',
];

type SymptomsState = Record<SymptomsKey, Severity>;

function defaultSymptoms(existing?: SymptomLog | null): SymptomsState {
  return {
    cramps:            existing?.cramps            ?? 'none',
    bloating:          existing?.bloating          ?? 'none',
    headache:          existing?.headache          ?? 'none',
    fatigue:           existing?.fatigue           ?? 'none',
    breast_tenderness: existing?.breast_tenderness ?? 'none',
    spotting:          existing?.spotting          ?? 'none',
  };
}

const inputStyle = { border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)', color: 'var(--color-text-primary)' };

export function LogSymptomsForm({ existing, onSubmit, initialDate, isOnPeriod = false }: Props) {
  const [logDate, setLogDate]         = useState(initialDate ?? existing?.log_date ?? toISODate(new Date()));
  const [values, setValues]           = useState<SymptomsState>(defaultSymptoms(existing));
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity | null>(existing?.flow_intensity ?? null);
  const [otherSymptoms, setOtherSymptoms] = useState<string[]>(existing?.other_symptoms ?? []);
  const [discharge, setDischarge]         = useState<DischargeType | null>(existing?.discharge ?? null);
  const [bowelMovement, setBowelMovement] = useState<BowelMovement | null>(existing?.bowel_movement ?? null);
  const [foodCraving, setFoodCraving]     = useState<boolean | null>(existing?.food_craving ?? null);
  const [foodCravingNotes, setFoodCravingNotes] = useState(existing?.food_craving_notes ?? '');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(existing?.feeling_emoji ?? null);
  const [notes, setNotes]             = useState(existing?.notes ?? '');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const set = (key: keyof SymptomsState, value: Severity) =>
    setValues(v => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        log_date: logDate,
        mood: 'none',
        ...values,
        flow_intensity:      isOnPeriod ? flowIntensity : null,
        other_symptoms:      otherSymptoms.length > 0 ? otherSymptoms : null,
        discharge,
        sleep_quality:       null,
        bowel_movement:      bowelMovement,
        food_craving:        foodCraving,
        food_craving_notes:  foodCraving ? (foodCravingNotes.trim() || null) : null,
        feeling_emoji:       selectedEmoji,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!initialDate && (
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-peat-deep)' }}>Date *</label>
          <input
            type="date" required value={logDate}
            onChange={e => setLogDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            style={inputStyle}
          />
        </div>
      )}

      {/* Emoji feeling picker */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-peat-deep)' }}>
          How are you feeling?
          {selectedEmoji && <span className="ml-2 text-xl leading-none">{selectedEmoji}</span>}
        </label>
        <div className="grid grid-cols-9 gap-1.5">
          {FEELING_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedEmoji(prev => prev === emoji ? null : emoji)}
              className="flex items-center justify-center w-full text-xl leading-none p-1.5 rounded-lg transition-all"
              style={selectedEmoji === emoji
                ? { background: 'var(--color-accent-light)', outline: '2px solid var(--color-accent)', transform: 'scale(1.1)' }
                : undefined
              }
              onMouseEnter={e => { if (selectedEmoji !== emoji) e.currentTarget.style.background = 'var(--color-peat-mid)'; }}
              onMouseLeave={e => { if (selectedEmoji !== emoji) e.currentTarget.style.background = 'transparent'; }}
              aria-label={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Symptom severity grid */}
      <div className="space-y-3">
        {/* Flow intensity — only during active period */}
        {isOnPeriod && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm sm:w-40 sm:shrink-0" style={{ color: 'var(--color-peat-deep)' }}>Flow intensity</span>
            <div className="flex flex-wrap gap-1">
              {FLOW_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFlowIntensity(prev => prev === opt.value ? null : opt.value)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                  style={flowIntensity === opt.value
                    ? { background: 'var(--color-phase-menstrual)', color: 'var(--color-text-primary)', borderColor: 'var(--color-peat-deep)' }
                    : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', borderColor: 'var(--color-peat-mid)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {SYMPTOMS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm sm:w-40 sm:shrink-0" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
            <div className="flex flex-wrap gap-1">
              {SEVERITIES.map(s => {
                const active = values[key] === s;
                const st = severityActive[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set(key, s)}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize"
                    style={active
                      ? { background: st.bg, color: st.color, borderColor: 'transparent' }
                      : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', borderColor: 'var(--color-peat-mid)' }
                    }
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {/* Discharge */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm sm:w-40 sm:shrink-0" style={{ color: 'var(--color-peat-deep)' }}>Discharge</span>
          <div className="flex flex-wrap gap-1">
            {DISCHARGE_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setDischarge(prev => prev === opt ? null : opt)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize"
                style={discharge === opt
                  ? { background: 'var(--color-peat-mid)', color: 'var(--color-peat-dark)', borderColor: 'transparent' }
                  : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', borderColor: 'var(--color-peat-mid)' }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Bowel movements */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-sm sm:w-40 sm:shrink-0" style={{ color: 'var(--color-peat-deep)' }}>Bowel movements</span>
          <div className="flex flex-wrap gap-1">
            {BOWEL_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setBowelMovement(prev => prev === opt ? null : opt)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize"
                style={bowelMovement === opt
                  ? { background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)', borderColor: 'transparent' }
                  : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', borderColor: 'var(--color-peat-mid)' }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Food cravings */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
          <span className="text-sm sm:w-40 sm:shrink-0 sm:pt-1" style={{ color: 'var(--color-peat-deep)' }}>Food cravings?</span>
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex gap-1">
              {([true, false] as const).map(val => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => {
                    setFoodCraving(prev => prev === val ? null : val);
                    if (val === false) setFoodCravingNotes('');
                  }}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                  style={foodCraving === val
                    ? { background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)', borderColor: 'transparent' }
                    : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', borderColor: 'var(--color-peat-mid)' }
                  }
                >
                  {val ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
            {foodCraving === true && (
              <input
                type="text"
                placeholder="What are you craving?"
                value={foodCravingNotes}
                onChange={e => setFoodCravingNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={inputStyle}
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      {/* Related symptoms — grouped pill multi-select */}
      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-peat-deep)' }}>
          Related symptoms
          {otherSymptoms.length > 0 && (
            <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}>
              {otherSymptoms.length} selected
            </span>
          )}
        </label>
        <div className="space-y-3">
          {OTHER_SYMPTOM_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs mb-1.5" style={{ color: 'var(--color-peat-deep)', opacity: 0.6 }}>{group.label}</p>
              <div className="flex flex-wrap gap-2">
                {group.items.map(symptom => {
                  const selected = otherSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => setOtherSymptoms(prev =>
                        selected ? prev.filter(s => s !== symptom) : [...prev, symptom]
                      )}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors"
                      style={selected
                        ? { background: 'var(--color-peat-dark)', color: 'var(--color-text-light)', border: '1px solid var(--color-peat-dark)' }
                        : { background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)', border: '1px solid var(--color-peat-mid)' }
                      }
                    >
                      <span
                        className="flex items-center justify-center rounded-full text-xs leading-none shrink-0"
                        style={{
                          width: 14, height: 14,
                          border: `1px solid ${selected ? 'var(--color-text-light)' : 'var(--color-peat-mid)'}`,
                          background: selected ? 'var(--color-text-light)' : 'transparent',
                          color: selected ? 'var(--color-peat-dark)' : 'var(--color-peat-deep)',
                          fontSize: 9,
                        }}
                      >
                        {selected ? '✓' : '+'}
                      </span>
                      {symptom}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-peat-deep)' }}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
          style={inputStyle}
        />
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--color-accent-dark)' }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60"
        style={{ background: 'var(--color-moss-base)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-moss-dark)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-moss-base)')}
      >
        {loading ? 'Saving…' : 'Save symptoms'}
      </button>
    </form>
  );
}
