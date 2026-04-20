import { useState } from 'react';
import { useCycles } from '../hooks/useCycles';
import { useSymptoms } from '../hooks/useSymptoms';
import { usePredictions } from '../hooks/usePredictions';
import { useSettings } from '../hooks/useSettings';
import { useMedications } from '../hooks/useMedications';
import { ExerciseCard } from '../components/health/ExerciseCard';
import { SupplementCard } from '../components/health/SupplementCard';
import { HealthContentTabs } from '../components/health/HealthContentTabs';
import { HormoneChart } from '../components/hormones/HormoneChart';
import { TodaySymptomsCard } from '../components/symptoms/TodaySymptomsCard';
import { MedicationsPopup } from '../components/medications/MedicationsPopup';
import { format, toISODate } from '../lib/dateUtils';
import { PixelLoader } from '../components/ui/PixelLoader';

export function HealthPage() {
  const [showMeds, setShowMeds] = useState(false);
  const { cycles, loading: cyclesLoading } = useCycles();
  const { symptoms, loading: symptomsLoading } = useSymptoms();
  const { customCycleLength, customPeriodDuration, nextPeriodDelayDays } = useSettings();
  const prediction = usePredictions(cycles, { customCycleLength, customPeriodDuration, delayDays: nextPeriodDelayDays });
  const { medications, saveMedication, removeMedication } = useMedications();

  if (cyclesLoading || symptomsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <PixelLoader size={56} />
      </div>
    );
  }

  const todayISO = toISODate(new Date());
  const todaySymptoms = symptoms.find(s => s.log_date === todayISO) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl md:text-[38px]" style={{ color: 'var(--color-text-primary)' }}>Health</h1>
          <p className="text-sm mt-2" style={{ color: '#F0EDE6' }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="relative group/meds mt-1">
          <button
            onClick={() => setShowMeds(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors text-base"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}
          >
            💊
          </button>
          <span
            className="pointer-events-none absolute top-full right-0 mt-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs opacity-0 group-hover/meds:opacity-100 transition-opacity"
            style={{ background: 'var(--color-peat-dark)', color: 'var(--color-text-light)' }}
          >
            Medications
          </span>
        </div>
      </div>

      {/* Hormone chart (2/3) + Today's symptoms (1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-stretch">
        <div className="md:col-span-2">
          <HormoneChart cycles={cycles} prediction={prediction} />
        </div>
        <div className="md:col-span-1">
          <TodaySymptomsCard symptomLog={todaySymptoms} prediction={prediction} />
        </div>
      </div>

      <HealthContentTabs cycles={cycles} prediction={prediction} />

      <ExerciseCard cycles={cycles} prediction={prediction} />

      <SupplementCard cycles={cycles} prediction={prediction} />

      {showMeds && (
        <MedicationsPopup
          medications={medications}
          onSave={saveMedication}
          onDelete={removeMedication}
          onClose={() => setShowMeds(false)}
        />
      )}
    </div>
  );
}
