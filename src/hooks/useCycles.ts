import { useEffect, useState, useCallback } from 'react';
import type { Cycle, FlowIntensity } from '../types';
import { getCycles, upsertCycle, deleteCycle } from '../services/cycleService';
import { useAuth } from './useAuth';

function periodsOverlap(
  start1: string, end1: string | null,
  start2: string, end2: string | null,
): boolean {
  const s1 = new Date(start1);
  const e1 = end1 ? new Date(end1) : new Date('2100-01-01');
  const s2 = new Date(start2);
  const e2 = end2 ? new Date(end2) : new Date('2100-01-01');
  return s1 <= e2 && s2 <= e1;
}

export function useCycles() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getCycles();
      setCycles(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addOrUpdateCycle = async (
    input: {
      start_date: string;
      end_date?: string | null;
      flow: FlowIntensity;
      notes?: string | null;
    },
    options?: { excludeId?: string },
  ) => {
    // Block overlapping periods (exclude the record being edited by start_date, or by id when replacing)
    const others = cycles.filter(
      c => c.start_date !== input.start_date && c.id !== options?.excludeId,
    );
    for (const c of others) {
      if (periodsOverlap(input.start_date, input.end_date ?? null, c.start_date, c.end_date)) {
        throw new Error(
          `These dates overlap with an existing period (${c.start_date}${c.end_date ? ` – ${c.end_date}` : ', ongoing'}). Please adjust your dates.`
        );
      }
    }

    const saved = await upsertCycle(input);
    setCycles(prev => {
      const idx = prev.findIndex(c => c.start_date === saved.start_date);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const removeCycle = async (id: string) => {
    setCycles(prev => prev.filter(c => c.id !== id));
    try {
      await deleteCycle(id);
    } catch (e) {
      await load(); // revert on error
      throw e;
    }
  };

  return { cycles, loading, error, addOrUpdateCycle, removeCycle, reload: load };
}
