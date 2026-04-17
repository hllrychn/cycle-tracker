import { PixelLoader } from '../components/ui/PixelLoader';

const VARIANTS: { size: number; color: string; label: string }[] = [
  { size: 32,  color: 'var(--color-moss-base)',    label: 'Small · moss'     },
  { size: 52,  color: 'var(--color-moss-base)',    label: 'Default · moss'   },
  { size: 72,  color: 'var(--color-moss-base)',    label: 'Large · moss'     },
  { size: 52,  color: 'var(--color-peat-deep)',    label: 'Default · peat'   },
  { size: 52,  color: 'var(--color-accent-dark)',  label: 'Default · accent' },
  { size: 52,  color: 'var(--color-blue-base)',    label: 'Default · blue'   },
];

export function LoaderPage() {
  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="font-semibold text-3xl md:text-[42px]" style={{ color: 'var(--color-text-primary)' }}>
        Pixel loader
      </h1>

      <div
        className="rounded-2xl p-8 grid grid-cols-3 gap-8 place-items-center"
        style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-mid)' }}
      >
        {VARIANTS.map(({ size, color, label }) => (
          <div key={label} className="flex flex-col items-center gap-3">
            <PixelLoader size={size} color={color} />
            <span className="text-xs text-center" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Dark background preview */}
      <div
        className="rounded-2xl p-8 flex items-center justify-center gap-12"
        style={{ background: 'rgba(46,40,32,0.88)' }}
      >
        <PixelLoader size={52} color="var(--color-moss-base)"   />
        <PixelLoader size={52} color="var(--color-text-light)"  />
        <PixelLoader size={52} color="var(--color-phase-luteal)" />
      </div>
    </div>
  );
}
