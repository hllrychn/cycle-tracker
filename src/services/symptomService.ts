import { supabase } from '../lib/supabase';
import type { SymptomLog, Severity, DischargeType, SleepQuality, BowelMovement, FlowIntensity } from '../types';

export async function getSymptoms(): Promise<SymptomLog[]> {
  const { data, error } = await supabase
    .from('symptoms')
    .select('*')
    .order('log_date', { ascending: false });

  if (error) throw error;
  return data as SymptomLog[];
}

export async function upsertSymptomLog(log: {
  log_date: string;
  mood: Severity;
  cramps: Severity;
  bloating: Severity;
  headache: Severity;
  fatigue: Severity;
  breast_tenderness: Severity;
  spotting: Severity;
  flow_intensity?:     FlowIntensity | null;
  other_symptoms?:     string[]      | null;
  discharge?:          DischargeType | null;
  sleep_quality?:      SleepQuality  | null;
  bowel_movement?:     BowelMovement | null;
  food_craving?:       boolean | null;
  food_craving_notes?: string  | null;
  feeling_emoji?:      string  | null;
  notes?:              string  | null;
}): Promise<SymptomLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Only the original schema columns go into the base upsert so that any
  // migration-added column can never block the core save.
  const {
    flow_intensity, other_symptoms,
    spotting,
    sleep_quality, bowel_movement,
    food_craving, food_craving_notes,
    feeling_emoji,
    ...rest
  } = log;

  const { data, error } = await supabase
    .from('symptoms')
    .upsert(
      { ...rest, user_id: user.id },
      { onConflict: 'user_id,log_date' }
    )
    .select()
    .single();

  if (error) throw error;

  // Persist all migration-added fields in a follow-up update.
  // Errors here are intentionally not thrown so a missing column never
  // rolls back the core save.
  await supabase
    .from('symptoms')
    .update({
      flow_intensity:     flow_intensity     ?? null,
      other_symptoms:     other_symptoms     ?? null,
      spotting:           spotting           ?? 'none',
      sleep_quality:      sleep_quality      ?? null,
      bowel_movement:     bowel_movement     ?? null,
      food_craving:       food_craving       ?? null,
      food_craving_notes: food_craving_notes ?? null,
      feeling_emoji:      feeling_emoji      ?? null,
    })
    .eq('id', (data as SymptomLog).id);

  return data as SymptomLog;
}

export async function deleteSymptomLog(id: string): Promise<void> {
  const { error } = await supabase.from('symptoms').delete().eq('id', id);
  if (error) throw error;
}

export async function clearAllSymptoms(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('symptoms').delete().eq('user_id', user.id);
  if (error) throw error;
}
