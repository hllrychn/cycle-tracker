import { supabase } from '../lib/supabase';

export type MedicationFrequency =
  | 'daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'morning'
  | 'evening'
  | 'bedtime'
  | 'every_other_day'
  | 'weekly'
  | 'twice_weekly'
  | 'monthly'
  | 'as_needed';

export const FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  daily:              'Daily',
  twice_daily:        'Twice daily',
  three_times_daily:  '3× daily',
  four_times_daily:   '4× daily',
  morning:            'Morning',
  evening:            'Evening',
  bedtime:            'Bedtime',
  every_other_day:    'Every other day',
  weekly:             'Weekly',
  twice_weekly:       '2× weekly',
  monthly:            'Monthly',
  as_needed:          'As needed',
};

export const FREQUENCY_GROUPS: { label: string; values: MedicationFrequency[] }[] = [
  { label: 'Daily', values: ['daily', 'twice_daily', 'three_times_daily', 'four_times_daily'] },
  { label: 'Time of day', values: ['morning', 'evening', 'bedtime'] },
  { label: 'Less frequent', values: ['every_other_day', 'weekly', 'twice_weekly', 'monthly'] },
  { label: 'Other', values: ['as_needed'] },
];

/** Returns true if a medication with this frequency should be shown on the given date. */
export function isMedicationDueOnDate(
  freq: MedicationFrequency | null,
  startDate: string | null,
  targetDate: string,
): boolean {
  if (!freq || freq === 'as_needed') return true;
  if (['daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'morning', 'evening', 'bedtime'].includes(freq)) return true;

  if (!startDate) return true; // can't calculate without a start — show it

  const start  = new Date(startDate + 'T00:00:00');
  const target = new Date(targetDate + 'T00:00:00');
  const diffDays = Math.round((target.getTime() - start.getTime()) / 86_400_000);

  if (freq === 'every_other_day') return diffDays >= 0 && diffDays % 2 === 0;
  if (freq === 'weekly')          return diffDays >= 0 && diffDays % 7 === 0;
  if (freq === 'twice_weekly')    return diffDays >= 0 && diffDays % 3 === 0; // approx every 3-4 days
  if (freq === 'monthly')         return start.getDate() === target.getDate();

  return true;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  type: 'medication' | 'birth_control' | 'supplement' | 'other';
  dose: string | null;
  frequency: MedicationFrequency | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationInput {
  id?: string;
  name: string;
  type: Medication['type'];
  dose?: string | null;
  frequency?: MedicationFrequency | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  active?: boolean;
}

export async function getMedications(): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Medication[];
}

export async function upsertMedication(med: MedicationInput): Promise<Medication> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('medications')
    .upsert({
      ...(med.id ? { id: med.id } : {}),
      user_id:   user.id,
      name:      med.name,
      type:      med.type,
      dose:       med.dose       ?? null,
      frequency:  med.frequency  ?? null,
      start_date: med.start_date ?? null,
      end_date:   med.end_date   ?? null,
      notes:      med.notes      ?? null,
      active:    med.active    ?? true,
    }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as Medication;
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await supabase.from('medications').delete().eq('id', id);
  if (error) throw error;
}
