import { supabase } from '../lib/supabase';
import type { Appointment, TestItem } from '../types';

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('doctor_appointments')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Appointment[];
}

export interface AppointmentInput {
  id?: string;
  date: string;
  time?: string | null;
  doctor?: string | null;
  doctor_type?: string | null;
  reason?: string | null;
  facility?: string | null;
  address?: string | null;
  questions?: string[];
  notes?: string | null;
  tests?: TestItem[];
}

export async function upsertAppointment(appt: AppointmentInput): Promise<Appointment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('doctor_appointments')
    .upsert({
      ...(appt.id ? { id: appt.id } : {}),
      user_id:   user.id,
      date:      appt.date,
      time:      appt.time      ?? null,
      doctor:      appt.doctor      ?? null,
      doctor_type: appt.doctor_type ?? null,
      reason:      appt.reason      ?? null,
      facility:    appt.facility    ?? null,
      address:     appt.address     ?? null,
      questions: appt.questions ?? [],
      notes:     appt.notes     ?? null,
      tests:     appt.tests     ?? [],
    }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as Appointment;
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('doctor_appointments').delete().eq('id', id);
  if (error) throw error;
}
