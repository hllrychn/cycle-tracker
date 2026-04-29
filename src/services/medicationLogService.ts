import { supabase } from '../lib/supabase';

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_id: string;
  log_date: string;
  taken: boolean;
  created_at: string;
}

export async function getMedicationLogs(logDate: string): Promise<MedicationLog[]> {
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('log_date', logDate);
  if (error) throw error;
  return (data ?? []) as MedicationLog[];
}

export async function upsertMedicationLog(
  medicationId: string,
  logDate: string,
  taken: boolean,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('medication_logs')
    .upsert(
      { user_id: user.id, medication_id: medicationId, log_date: logDate, taken },
      { onConflict: 'user_id,medication_id,log_date' },
    );
  if (error) throw error;
}
