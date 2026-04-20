import { useState, useEffect, useCallback } from 'react';
import {
  getMedications,
  upsertMedication,
  deleteMedication,
  type Medication,
  type MedicationInput,
} from '../services/medicationService';

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getMedications();
      setMedications(data);
    } catch {
      // table may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveMedication = useCallback(async (input: MedicationInput) => {
    const saved = await upsertMedication(input);
    setMedications(prev => {
      const idx = prev.findIndex(m => m.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    return saved;
  }, []);

  const removeMedication = useCallback(async (id: string) => {
    await deleteMedication(id);
    setMedications(prev => prev.filter(m => m.id !== id));
  }, []);

  return { medications, loading, saveMedication, removeMedication };
}
