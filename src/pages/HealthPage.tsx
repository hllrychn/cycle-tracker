import { useCycles } from '../hooks/useCycles';
import { useSymptoms } from '../hooks/useSymptoms';
import { usePredictions } from '../hooks/usePredictions';
import { useSettings } from '../hooks/useSettings';
import { ExerciseCard } from '../components/health/ExerciseCard';
import { SupplementCard } from '../components/health/SupplementCard';
import { HealthContentTabs } from '../components/health/HealthContentTabs';
import { HormoneChart } from '../components/hormones/HormoneChart';
import { TodaySymptomsCard } from '../components/symptoms/TodaySymptomsCard';
import { format, toISODate } from '../lib/dateUtils';
import { PixelLoader } from '../components/ui/PixelLoader';

export function HealthPage() {
  const { cycles, loading: cyclesLoading } = useCycles();
  const { symptoms, loading: symptomsLoading } = useSymptoms();
  const { customCycleLength, customPeriodDuration, nextPeriodDelayDays } = useSettings();
  const prediction = usePredictions(cycles, { customCycleLength, customPeriodDuration, delayDays: nextPeriodDelayDays });

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
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Health</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-peat-deep)' }}>
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Hormone chart (2/3) + Today's symptoms (1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-stretch">
        <div className="md:col-span-2">
          <HormoneChart cycles={cycles} prediction={prediction} />
        </div>
        <div className="md:col-span-1">
          <TodaySymptomsCard symptomLog={todaySymptoms} />
        </div>
      </div>

      <HealthContentTabs cycles={cycles} prediction={prediction} />

      <ExerciseCard cycles={cycles} prediction={prediction} />

      <SupplementCard cycles={cycles} prediction={prediction} />
    </div>
  );
}
