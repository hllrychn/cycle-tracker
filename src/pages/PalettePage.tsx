const GROUPS = [
  {
    label: 'Olive (primary)',
    swatches: [
      { name: 'moss-dark',  token: '--color-moss-dark',  hex: '#3A3812' },
      { name: 'moss-base',  token: '--color-moss-base',  hex: '#9E9A3C' },
      { name: 'moss-mid',   token: '--color-moss-mid',   hex: '#C4C170' },
      { name: 'moss-light', token: '--color-moss-light', hex: '#E8E6B8' },
    ],
  },
  {
    label: 'Cornflower (secondary)',
    swatches: [
      { name: 'blue-dark',  token: '--color-blue-dark',  hex: '#1A2A3F' },
      { name: 'blue-base',  token: '--color-blue-base',  hex: '#4A7FD4' },
      { name: 'blue-mid',   token: '--color-blue-mid',   hex: '#8AAEE0' },
      { name: 'blue-light', token: '--color-blue-light', hex: '#C8DAF5' },
    ],
  },
  {
    label: 'Peat (backgrounds)',
    swatches: [
      { name: 'bg-dark',    token: '--color-bg-dark',    hex: '#221D17' },
      { name: 'peat-dark',  token: '--color-peat-dark',  hex: '#2E2820' },
      { name: 'peat-deep',  token: '--color-peat-deep',  hex: '#786B64' },
      { name: 'bg-app',     token: '--color-bg-app',     hex: '#786B64' },
      { name: 'peat-mid',   token: '--color-peat-mid',   hex: '#D4CCBC' },
      { name: 'peat-light', token: '--color-peat-light', hex: '#F0EDE6' },
    ],
  },
  {
    label: 'Accent (mauve)',
    swatches: [
      { name: 'accent-dark',  token: '--color-accent-dark',  hex: '#7B5F78' },
      { name: 'accent',       token: '--color-accent',       hex: '#C9A0C2' },
      { name: 'accent-light', token: '--color-accent-light', hex: '#EDD9EA' },
    ],
  },
  {
    label: 'Cycle phases',
    swatches: [
      { name: 'menstrual',  token: '--color-phase-menstrual',  hex: '#E8E4DC' },
      { name: 'follicular', token: '--color-phase-follicular', hex: '#C8DAF5' },
      { name: 'ovulation',  token: '--color-phase-ovulation',  hex: '#DCF0B8' },
      { name: 'luteal',     token: '--color-phase-luteal',     hex: '#D4CCBC' },
    ],
  },
];

function isDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function PalettePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Color palette
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-peat-deep)' }}>
          All tokens from tokens.css
        </p>
      </div>

      {GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: 'var(--color-peat-deep)' }}>
            {group.label}
          </p>
          <div className="flex gap-3 flex-wrap">
            {group.swatches.map(s => {
              const dark = isDark(s.hex);
              return (
                <div
                  key={s.name}
                  className="rounded-xl overflow-hidden"
                  style={{
                    width: '120px',
                    boxShadow: '0 2px 8px rgba(46,40,32,0.12)',
                    border: '1px solid rgba(46,40,32,0.08)',
                  }}
                >
                  {/* Color block */}
                  <div
                    className="flex flex-col justify-end p-3"
                    style={{ background: `var(${s.token})`, height: '88px' }}
                  >
                    <span
                      className="text-xs font-semibold font-mono"
                      style={{ color: dark ? '#F0EDE6' : '#243A14' }}
                    >
                      {s.hex}
                    </span>
                  </div>
                  {/* Label */}
                  <div className="px-3 py-2" style={{ background: '#FFFFFF' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {s.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-peat-deep)', fontSize: '10px' }}>
                      {s.token}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
