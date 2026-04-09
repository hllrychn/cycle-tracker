import { useEffect, useState, useCallback } from 'react';
import type { SymptomLog } from '../types';
import { getSymptoms, upsertSymptomLog, deleteSymptomLog } from '../services/symptomService';
import { useAuth } from './useAuth';

export function useSymptoms() {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getSymptoms();
      setSymptoms(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const logSymptoms = async (input: Omit<SymptomLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const saved = await upsertSymptomLog(input);
    setSymptoms(prev => {
      const idx = prev.findIndex(s => s.log_date === saved.log_date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const removeSymptomLog = async (id: string) => {
    setSymptoms(prev => prev.filter(s => s.id !== id));
    try {
      await deleteSymptomLog(id);
    } catch (e) {
      await load();
      throw e;
    }
  };

  return { symptoms, loading, error, logSymptoms, removeSymptomLog };
}
