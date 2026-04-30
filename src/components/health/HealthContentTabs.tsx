import { HealthyFoodsCard } from '../nutrition/HealthyFoodsCard';
import type { Cycle, Prediction } from '../../types';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
}

export function HealthContentTabs({ cycles, prediction }: Props) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}
    >
      <HealthyFoodsCard bare cycles={cycles} prediction={prediction} />
    </div>
  );
}
