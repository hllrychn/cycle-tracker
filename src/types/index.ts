export type FlowIntensity  = 'spotting' | 'light' | 'medium' | 'heavy';
export type Severity       = 'none' | 'mild' | 'moderate' | 'severe';
export type DischargeType  = 'dry' | 'sticky' | 'wet' | 'creamy';
export type SleepQuality   = 'poor' | 'fair' | 'good' | 'great';
export type BowelMovement  = 'normal' | 'constipated' | 'loose' | 'diarrhea';

export interface Cycle {
  id: string;
  user_id: string;
  start_date: string; // ISO date "YYYY-MM-DD"
  end_date: string | null;
  flow: FlowIntensity;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SymptomLog {
  id: string;
  user_id: string;
  log_date: string;
  mood: Severity;
  cramps: Severity;
  bloating: Severity;
  headache: Severity;
  fatigue: Severity;
  breast_tenderness: Severity;
  spotting: Severity;
  flow_intensity:      FlowIntensity | null;
  other_symptoms:      string[]      | null;
  discharge:           DischargeType | null;
  sleep_quality:       SleepQuality  | null;
  bowel_movement:      BowelMovement | null;
  food_craving:        boolean | null;
  food_craving_notes:  string  | null;
  feeling_emoji:       string  | null;
  bbt:                 number  | null;
  notes:               string  | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  date: string;           // YYYY-MM-DD
  time: string | null;    // HH:MM
  doctor: string | null;
  facility: string | null;
  questions: string[];    // checklist items
  notes: string | null;
  tests: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  nextPeriodStart: Date;
  nextPeriodEnd: Date;
  ovulationDay: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  avgCycleLength: number;
  avgPeriodDuration: number;
  cycleVariation: number | null;
  confidence: 'low' | 'medium' | 'high';
}
