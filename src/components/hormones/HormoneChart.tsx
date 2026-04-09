import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Prediction } from '../../types';
import { differenceInDays, parseISO } from '../../lib/dateUtils';
import type { Cycle } from '../../types';

interface Props {
  cycles: Cycle[];
  prediction: Prediction | null;
  bare?: boolean;
}

const HORMONE_DATA: { day: number; estrogen: number; progesterone: number; testosterone: number; lh: number }[] = [
  { day: 1,  estrogen: 15, progesterone: 5,  testosterone: 30, lh: 8  },
  { day: 2,  estrogen: 14, progesterone: 4,  testosterone: 28, lh: 8  },
  { day: 3,  estrogen: 14, progesterone: 4,  testosterone: 27, lh: 8  },
  { day: 4,  estrogen: 16, progesterone: 4,  testosterone: 28, lh: 8  },
  { day: 5,  estrogen: 20, progesterone: 4,  testosterone: 30, lh: 9  },
  { day: 6,  estrogen: 28, progesterone: 4,  testosterone: 32, lh: 9  },
  { day: 7,  estrogen: 36, progesterone: 5,  testosterone: 35, lh: 9  },
  { day: 8,  estrogen: 46, progesterone: 5,  testosterone: 38, lh: 10 },
  { day: 9,  estrogen: 58, progesterone: 5,  testosterone: 42, lh: 11 },
  { day: 10, estrogen: 70, progesterone: 6,  testosterone: 48, lh: 13 },
  { day: 11, estrogen: 85, progesterone: 7,  testosterone: 56, lh: 18 },
  { day: 12, estrogen: 98, progesterone: 8,  testosterone: 65, lh: 40 },
  { day: 13, estrogen: 100,progesterone: 9,  testosterone: 72, lh: 100},
  { day: 14, estrogen: 80, progesterone: 12, testosterone: 68, lh: 60 },
  { day: 15, estrogen: 55, progesterone: 22, testosterone: 55, lh: 15 },
  { day: 16, estrogen: 46, progesterone: 38, testosterone: 48, lh: 10 },
  { day: 17, estrogen: 44, progesterone: 54, testosterone: 44, lh: 9  },
  { day: 18, estrogen: 46, progesterone: 68, testosterone: 42, lh: 9  },
  { day: 19, estrogen: 50, progesterone: 78, testosterone: 40, lh: 9  },
  { day: 20, estrogen: 55, progesterone: 86, testosterone: 40, lh: 9  },
  { day: 21, estrogen: 60, progesterone: 100,testosterone: 40, lh: 9  },
  { day: 22, estrogen: 62, progesterone: 95, testosterone: 40, lh: 9  },
  { day: 23, estrogen: 58, progesterone: 85, testosterone: 40, lh: 9  },
  { day: 24, estrogen: 52, progesterone: 70, testosterone: 38, lh: 9  },
  { day: 25, estrogen: 44, progesterone: 52, testosterone: 36, lh: 9  },
  { day: 26, estrogen: 34, progesterone: 34, testosterone: 34, lh: 8  },
  { day: 27, estrogen: 22, progesterone: 18, testosterone: 31, lh: 8  },
  { day: 28, estrogen: 16, progesterone: 8,  testosterone: 30, lh: 8  },
];

function getCurrentCycleDay(cycles: Cycle[]): number | null {
  if (cycles.length === 0) return null;
  const sorted = [...cycles].sort((a, b) => b.start_date.localeCompare(a.start_date));
  const latest = sorted[0];
  const day = differenceInDays(new Date(), parseISO(latest.start_date)) + 1;
  return day >= 1 && day <= 60 ? day : null;
}

const PinLabel = ({ viewBox, day }: any) => {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  const pinR = 10;
  const labelW = 46;
  const labelH = 18;
  const boxX = x - labelW / 2;
  const boxY = y - pinR * 2 - labelH - 4;

  return (
    <g>
      <circle cx={x} cy={y - pinR} r={pinR} fill="var(--color-moss-dark)" />
      <circle cx={x} cy={y - pinR} r={pinR - 3} fill="var(--color-bg-app)" />
      <circle cx={x} cy={y - pinR} r={4} fill="var(--color-moss-dark)" />
      <rect x={boxX} y={boxY} width={labelW} height={labelH} rx={9} fill="var(--color-moss-dark)" />
      <text x={x} y={boxY + 12} textAnchor="middle" fill="white" fontSize={10} fontWeight="600">
        Day {day}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg shadow-md p-3 text-xs" style={{ background: 'var(--color-peat-light)', border: '1px solid var(--color-peat-mid)' }}>
      <p className="font-normal mb-1" style={{ color: 'var(--color-text-primary)' }}>Day {label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  );
};

export function HormoneChart({ cycles, prediction, bare = false }: Props) {
  const currentDay = getCurrentCycleDay(cycles);

  const cycleLength = prediction?.avgCycleLength ?? 28;
  const data = cycleLength === 28
    ? HORMONE_DATA
    : HORMONE_DATA.map(d => ({
        ...d,
        day: Math.round((d.day / 28) * cycleLength),
      })).filter((d, i, arr) => i === 0 || d.day !== arr[i - 1].day);

  const inner = (
    <>
      {!bare && (
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Hormone levels</h2>
          <div className="flex items-center gap-2">
            {currentDay && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}>
                Day {currentDay}
              </span>
            )}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: 'var(--color-blue-base)', color: '#FFFFFF' }}>📈</div>
          </div>
        </div>
      )}
      {bare && currentDay && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Hormone levels</p>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}>
            Day {currentDay}
          </span>
        </div>
      )}
      {bare && !currentDay && (
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Hormone levels</p>
      )}
      <p className={`text-xs ${bare ? 'mb-2' : 'mb-4'}`} style={{ color: 'var(--color-peat-deep)' }}>
        Reference curves · relative levels across a {cycleLength}-day cycle. Not a measurement of your actual levels.
      </p>

      <ResponsiveContainer width="100%" height={bare ? 222 : 256}>
        <LineChart data={data} margin={{ top: 52, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-peat-mid)" />
          <XAxis
            dataKey="day"
            ticks={data.map(d => d.day)}
            tickFormatter={v => v % 2 === 0 ? String(v) : ''}
            tick={{ fontSize: 11, fill: 'var(--color-peat-deep)' }}
            label={{ value: 'Cycle day', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--color-peat-deep)' }}
            height={36}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-peat-deep)' }}
            tickFormatter={v => `${v}%`}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) => <span style={{ color: 'var(--color-peat-deep)' }} className="capitalize">{value}</span>}
          />

          {currentDay && currentDay <= cycleLength && (
            <ReferenceLine
              x={currentDay}
              stroke="var(--color-moss-dark)"
              strokeWidth={2}
              label={<PinLabel day={currentDay} />}
            />
          )}

          <ReferenceLine
            x={cycleLength === 28 ? 13 : Math.round((13 / 28) * cycleLength)}
            stroke="var(--color-secondary)"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{ value: 'Ovulation', position: 'top', fontSize: 10, fill: 'var(--color-secondary)' }}
          />

          <Line dataKey="estrogen"     name="Estrogen"     stroke="var(--color-primary)"   strokeWidth={2} dot={false} />
          <Line dataKey="progesterone" name="Progesterone" stroke="#C9A0C2"                strokeWidth={2} dot={false} />
          <Line dataKey="testosterone" name="Testosterone" stroke="var(--color-moss-mid)"  strokeWidth={2} dot={false} />
          <Line dataKey="lh"           name="LH"           stroke="var(--color-blue-base)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>
    </>
  );

  if (bare) return inner;

  return (
    <div className="rounded-2xl p-6 h-full" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-blue-base)' }}>
      {inner}
    </div>
  );
}
