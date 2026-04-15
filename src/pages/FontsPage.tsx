export function FontsPage() {
  const divider = '1px solid var(--color-peat-light)';

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 style={{ color: 'var(--color-text-primary)' }}>Type styles</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--color-peat-deep)' }}>
          All typefaces and styles in use across the site.
        </p>
      </div>

      {/* Texturina — headings */}
      <section>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-peat-deep)' }}>
          Texturina — headings
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}>
          <div className="px-6 py-5" style={{ borderBottom: divider }}>
            <p className="text-xs mb-3" style={{ color: 'var(--color-peat-deep)' }}>Page heading — 36px, weight 400, left border #F0EDE6</p>
            <h1 style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          </div>
          <div className="px-6 py-5" style={{ borderBottom: divider }}>
            <p className="text-xs mb-3" style={{ color: 'var(--color-peat-deep)' }}>Weight range — Texturina supports 100–900</p>
            <div className="space-y-2">
              {([300, 400, 500, 600] as const).map(w => (
                <p key={w} style={{ fontFamily: "'Texturina', serif", fontSize: 28, fontWeight: w, color: 'var(--color-text-primary)' }}>
                  {w} — The quick brown fox
                </p>
              ))}
            </div>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs mb-3" style={{ color: 'var(--color-peat-deep)' }}>Italic</p>
            <p style={{ fontFamily: "'Texturina', serif", fontSize: 28, fontWeight: 400, fontStyle: 'italic', color: 'var(--color-text-primary)' }}>
              The quick brown fox
            </p>
          </div>
        </div>
      </section>

      {/* IBM Plex Mono — body */}
      <section>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-peat-deep)' }}>
          IBM Plex Mono — body
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}>
          {[
            { label: 'text-lg',   cls: 'text-lg',   note: '18px — calendar month' },
            { label: 'text-base', cls: 'text-base',  note: '16px — modal header' },
            { label: 'text-sm',   cls: 'text-sm',    note: '14px — body, labels, buttons' },
            { label: 'text-xs',   cls: 'text-xs',    note: '12px — badges, captions, metadata' },
          ].map(({ label, cls, note }, i, arr) => (
            <div
              key={label}
              className={`flex items-baseline gap-4 px-6 py-4`}
              style={{ borderBottom: i < arr.length - 1 ? divider : undefined }}
            >
              <span className="w-20 text-xs shrink-0" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
              <span className={cls} style={{ color: 'var(--color-text-primary)' }}>Aa — The quick brown fox</span>
              <span className="text-xs shrink-0 ml-auto hidden sm:inline" style={{ color: 'var(--color-peat-deep)' }}>{note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* IBM Plex Mono weights */}
      <section>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-peat-deep)' }}>
          IBM Plex Mono — weights
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-blue-base)' }}>
          {[
            { label: 'font-normal',   cls: 'font-normal',   weight: '400', note: 'body, prose, descriptions' },
            { label: 'font-medium',   cls: 'font-medium',   weight: '500', note: 'buttons, active nav, sublabels' },
            { label: 'font-semibold', cls: 'font-semibold', weight: '600', note: 'card titles, numbers, headings' },
          ].map(({ label, cls, weight, note }, i, arr) => (
            <div
              key={label}
              className="flex items-baseline gap-4 px-6 py-4"
              style={{ borderBottom: i < arr.length - 1 ? divider : undefined }}
            >
              <span className="w-28 text-xs shrink-0" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
              <span className={`text-sm ${cls}`} style={{ color: 'var(--color-text-primary)' }}>
                {weight} — The quick brown fox
              </span>
              <span className="text-xs shrink-0 ml-auto hidden sm:inline" style={{ color: 'var(--color-peat-deep)' }}>{note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Styles in context */}
      <section>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-peat-deep)' }}>
          Styles in context
        </p>
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-peat-mid)' }}>

          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-peat-deep)' }}>Page heading (Texturina 36px)</p>
            <h1 style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          </div>

          <div style={{ borderTop: divider, paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-peat-deep)' }}>Card header (IBM Plex Mono, 14px semibold)</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Hormone levels</p>
          </div>

          <div style={{ borderTop: divider, paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-peat-deep)' }}>Body text (IBM Plex Mono, 14px normal)</p>
            <p className="text-sm font-normal leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>
              Your estrogen is rising, bringing mental clarity and social energy. A great time to schedule important conversations or creative work.
            </p>
          </div>

          <div style={{ borderTop: divider, paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-peat-deep)' }}>Caption / badge (IBM Plex Mono, 12px)</p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}>High confidence</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-moss-light)', color: 'var(--color-moss-dark)' }}>Follicular</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)' }}>Light</span>
            </div>
          </div>

          <div style={{ borderTop: divider, paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-peat-deep)' }}>Stat number (IBM Plex Mono, 30px semibold)</p>
            <p className="text-3xl font-semibold leading-none" style={{ color: 'var(--color-moss-dark)' }}>28</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-peat-deep)' }}>days avg</p>
          </div>

          <div style={{ borderTop: divider, paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-peat-deep)' }}>Cycle day (IBM Plex Mono, clamp 48–72px semibold)</p>
            <p className="font-semibold leading-none" style={{ fontSize: 'clamp(48px, 8vw, 72px)', color: 'var(--color-phase-luteal)' }}>14</p>
          </div>

          <div style={{ borderTop: divider, paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--color-peat-deep)' }}>Buttons</p>
            <div className="flex gap-2 flex-wrap">
              <button className="px-4 py-2 text-sm font-medium rounded-xl text-white" style={{ background: 'var(--color-moss-base)' }}>Primary</button>
              <button className="px-4 py-2 text-sm font-medium rounded-xl" style={{ border: '1px solid var(--color-peat-mid)', color: 'var(--color-peat-deep)' }}>Secondary</button>
              <button className="text-xs font-medium" style={{ color: 'var(--color-peat-deep)' }}>Text link</button>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
