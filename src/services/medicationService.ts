import { supabase } from '../lib/supabase';

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  type: 'medication' | 'birth_control' | 'supplement' | 'other';
  dose: string | null;
  frequency: string | null;
  duration: string | null;
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
  frequency?: string | null;
  duration?: string | null;
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
      dose:      med.dose      ?? null,
      frequency: med.frequency ?? null,
      duration:  med.duration  ?? null,
      notes:     med.notes     ?? null,
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
