import { useState, useEffect, useCallback } from 'react';
import { getMedicationLogs, upsertMedicationLog } from '../services/medicationLogService';

export function useMedicationLogs(logDate: string) {
  // takenIds: set of medication_ids marked taken on this date
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const logs = await getMedicationLogs(logDate);
      setTakenIds(new Set(logs.filter(l => l.taken).map(l => l.medication_id)));
    } catch {
      // table may not exist yet — fail silently
    } finally {
      setReady(true);
    }
  }, [logDate]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (medicationId: string) => {
    const nowTaken = !takenIds.has(medicationId);
    setTakenIds(prev => {
      const next = new Set(prev);
      nowTaken ? next.add(medicationId) : next.delete(medicationId);
      return next;
    });
    try {
      await upsertMedicationLog(medicationId, logDate, nowTaken);
    } catch {
      // revert on failure
      setTakenIds(prev => {
        const next = new Set(prev);
        nowTaken ? next.delete(medicationId) : next.add(medicationId);
        return next;
      });
    }
  }, [logDate, takenIds]);

  return { takenIds, ready, toggle };
}
