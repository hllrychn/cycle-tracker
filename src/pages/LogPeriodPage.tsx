import { useNavigate } from 'react-router-dom';
import { LogPeriodForm } from '../components/period/LogPeriodForm';
import { useCycles } from '../hooks/useCycles';

export function LogPeriodPage() {
  const { cycles, addOrUpdateCycle, removeCycle } = useCycles();
  const navigate = useNavigate();

  // Most recent cycle by start_date — shown for editing if it exists
  const current = cycles.length > 0
    ? [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date))[0]
    : null;

  const handleSubmit = async (data: Parameters<typeof addOrUpdateCycle>[0]) => {
    if (current && data.start_date !== current.start_date) {
      // Start date changed — delete old record first, then insert new
      await removeCycle(current.id);
      await addOrUpdateCycle(data, { excludeId: current.id });
    } else {
      await addOrUpdateCycle(data, current ? { excludeId: current.id } : undefined);
    }
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-semibold mb-6" style={{ fontSize: '42px', color: 'var(--color-text-primary)' }}>
        {current ? 'Update current period' : 'Log a period'}
      </h1>
      <div className="rounded-2xl p-6 overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-mid)' }}>
        <LogPeriodForm existing={current} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
