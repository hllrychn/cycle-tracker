import { useEffect, useRef } from 'react';
import { PredictionCard } from './PredictionCard';
import type { Prediction } from '../../types';

interface Props {
  prediction: Prediction | null;
  customCycleLength: number | null;
  customPeriodDuration: number | null;
  delayDays: number;
  recurringCyclesCount: number;
  onSetCycleLength: (days: number | null) => void;
  onSetPeriodDuration: (days: number | null) => void;
  onSetRecurringCyclesCount: (n: number) => void;
  onClose: () => void;
}

export function PredictionsPopup({
  prediction,
  customCycleLength,
  customPeriodDuration,
  delayDays,
  recurringCyclesCount,
  onSetCycleLength,
  onSetPeriodDuration,
  onSetRecurringCyclesCount,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Delay so the opening click doesn't immediately close
    const id = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-40 w-80"
      style={{ filter: 'drop-shadow(0 8px 24px rgba(46,40,32,0.18))' }}
    >
      <PredictionCard
        prediction={prediction}
        customCycleLength={customCycleLength}
        customPeriodDuration={customPeriodDuration}
        delayDays={delayDays}
        recurringCyclesCount={recurringCyclesCount}
        onSetCycleLength={onSetCycleLength}
        onSetPeriodDuration={onSetPeriodDuration}
        onSetRecurringCyclesCount={onSetRecurringCyclesCount}
      />
    </div>
  );
}
