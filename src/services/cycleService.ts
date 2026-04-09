import { supabase } from '../lib/supabase';
import type { Cycle, FlowIntensity } from '../types';

export async function getCycles(): Promise<Cycle[]> {
  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data as Cycle[];
}

export async function upsertCycle(cycle: {
  start_date: string;
  end_date?: string | null;
  flow: FlowIntensity;
  notes?: string | null;
}): Promise<Cycle> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('cycles')
    .upsert(
      { ...cycle, user_id: user.id },
      { onConflict: 'user_id,start_date' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as Cycle;
}

export async function deleteCycle(id: string): Promise<void> {
  const { error } = await supabase.from('cycles').delete().eq('id', id);
  if (error) throw error;
}
