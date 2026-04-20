import { useEffect, useState, useCallback } from 'react';
import type { Appointment } from '../types';
import { getAppointments, upsertAppointment, deleteAppointment } from '../services/appointmentService';
import { useAuth } from './useAuth';

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getAppointments();
      setAppointments(data);
    } catch {
      // table may not exist yet — fail silently
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const saveAppointment = async (appt: Parameters<typeof upsertAppointment>[0]) => {
    const saved = await upsertAppointment(appt);
    setAppointments(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [...prev, saved].sort((a, b) => a.date.localeCompare(b.date));
    });
    return saved;
  };

  const removeAppointment = async (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    try { await deleteAppointment(id); } catch (e) { await load(); throw e; }
  };

  return { appointments, loading, saveAppointment, removeAppointment, reload: load };
}
