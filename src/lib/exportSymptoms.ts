import * as XLSX from 'xlsx';
import type { SymptomLog, Cycle, Prediction } from '../types';
import { differenceInDays, parseLocalDate, toISODate } from './dateUtils';

// ── Phase resolution (mirrors SymptomBarChart logic) ─────────────────────────

function subDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - n);
  return d;
}

function toPhase(day: number, avgLen: number, avgDur: number): string | null {
  if (day <= avgDur)           return 'Menstrual';
  if (day <= avgLen - 16)      return 'Follicular';
  if (day <= avgLen - 11)      return 'Ovulatory';
  if (day <= avgLen)           return 'Luteal';
  return null;
}

function resolvePhase(
  logDate: string,
  cycles: Cycle[],
  avgLen: number,
  avgDur: number,
  prediction?: Prediction | null,
): string {
  const past = cycles.filter(c => c.start_date <= logDate);

  if (past.length > 0) {
    const latest = [...past].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
    const day = differenceInDays(parseLocalDate(logDate), parseLocalDate(latest.start_date)) + 1;
    if (day >= 1 && day <= avgLen + 7) {
      const p = toPhase(day, avgLen, avgDur);
      if (p) return p;
    }
  }

  // Extrapolate backwards from earliest anchor
  const allCycles = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const anchorStr = allCycles.length > 0
    ? allCycles[0].start_date
    : prediction ? toISODate(prediction.nextPeriodStart) : null;
  if (!anchorStr) return 'Unknown';

  const anchorDate  = parseLocalDate(anchorStr);
  const logD        = parseLocalDate(logDate);
  const daysBefore  = differenceInDays(anchorDate, logD);
  if (daysBefore <= 0) return 'Unknown';

  const N        = Math.ceil(daysBefore / avgLen);
  const hypStart = subDays(anchorDate, N * avgLen);
  const day      = differenceInDays(logD, hypStart) + 1;
  if (day >= 1 && day <= avgLen) {
    const p = toPhase(day, avgLen, avgDur);
    if (p) return p;
  }
  return 'Unknown';
}

// ── Export ────────────────────────────────────────────────────────────────────

const SEVERITY_KEYS = ['cramps', 'bloating', 'headache', 'fatigue', 'breast_tenderness', 'spotting'] as const;

export function exportSymptomsToExcel(
  symptoms: SymptomLog[],
  cycles: Cycle[],
  prediction: Prediction | null,
) {
  const avgLen = prediction?.avgCycleLength    ?? 28;
  const avgDur = prediction?.avgPeriodDuration ?? 5;

  const sorted = [...symptoms].sort((a, b) => a.log_date.localeCompare(b.log_date));

  const rows = sorted.map(s => {
    const phase = resolvePhase(s.log_date, cycles, avgLen, avgDur, prediction);

    // Build symptom severity string: "Cramps (moderate), Headache (mild)"
    const severityParts = SEVERITY_KEYS
      .filter(k => s[k] && s[k] !== 'none')
      .map(k => `${k.replace('_', ' ')} (${s[k]})`);

    const relatedSymptoms = s.other_symptoms?.length ? s.other_symptoms.join(', ') : '';

    return {
      Date:                s.log_date,
      Phase:               phase,
      Mood:                s.feeling_emoji ?? '',
      'BBT (°F)':          s.bbt ?? '',
      Symptoms:            severityParts.join(', ') || '—',
      'Related symptoms':  relatedSymptoms,
      'Flow intensity':    s.flow_intensity ?? '',
      Discharge:           s.discharge ?? '',
      'Sleep quality':     s.sleep_quality ?? '',
      'Bowel movement':    s.bowel_movement ?? '',
      'Food craving':      s.food_craving ? (s.food_craving_notes || 'Yes') : '',
      Notes:               s.notes ?? '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 12 }, // Phase
    { wch: 6  }, // Mood
    { wch: 10 }, // BBT
    { wch: 45 }, // Symptoms
    { wch: 40 }, // Related symptoms
    { wch: 14 }, // Flow intensity
    { wch: 14 }, // Discharge
    { wch: 14 }, // Sleep quality
    { wch: 16 }, // Bowel movement
    { wch: 16 }, // Food craving
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Symptoms');
  XLSX.writeFile(wb, 'cycle-tracker-symptoms.xlsx');
}
