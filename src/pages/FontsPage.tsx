export function FontsPage() {
  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Type styles
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-peat-deep)' }}>
          IBM Plex Mono — all sizes and weights in use
        </p>
      </div>

      {/* Sizes */}
      <section>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-peat-deep)' }}>
          Sizes
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}>
          {[
            { label: 'text-3xl', cls: 'text-3xl', note: '30px — stat numbers' },
            { label: 'text-2xl', cls: 'text-2xl', note: '24px — page h1' },
            { label: 'text-xl',  cls: 'text-xl',  note: '20px — (available, unused)' },
            { label: 'text-lg',  cls: 'text-lg',  note: '18px — calendar month/year' },
            { label: 'text-base',cls: 'text-base', note: '16px — day detail modal header' },
            { label: 'text-sm',  cls: 'text-sm',  note: '14px — body, labels, buttons' },
            { label: 'text-xs',  cls: 'text-xs',  note: '12px — metadata, badges, captions' },
          ].map(({ label, cls, note }, i, arr) => (
            <div
              key={label}
              className="flex items-baseline gap-6 px-6 py-4"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-peat-light)' : undefined }}
            >
              <span className="w-20 text-xs shrink-0" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
              <span className={cls} style={{ color: 'var(--color-text-primary)' }}>
                Aa — The quick brown fox
              </span>
              <span className="text-xs shrink-0 ml-auto" style={{ color: 'var(--color-peat-deep)' }}>{note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Weights */}
      <section>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-peat-deep)' }}>
          Weights (shown at text-sm)
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-blue-base)' }}>
          {[
            { label: 'font-normal',   cls: 'font-normal',   weight: '400', note: 'body, prose, descriptions' },
            { label: 'font-medium',   cls: 'font-medium',   weight: '500', note: 'buttons, active nav, sublabels' },
            { label: 'font-semibold', cls: 'font-semibold', weight: '600', note: 'headings, card titles, numbers' },
            { label: 'font-bold',     cls: 'font-bold',     weight: '700', note: '(available, unused)' },
          ].map(({ label, cls, weight, note }, i, arr) => (
            <div
              key={label}
              className="flex items-baseline gap-6 px-6 py-4"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-peat-light)' : undefined }}
            >
              <span className="w-28 text-xs shrink-0" style={{ color: 'var(--color-peat-deep)' }}>{label}</span>
              <span className={`text-sm ${cls}`} style={{ color: 'var(--color-text-primary)' }}>
                {weight} — The quick brown fox
              </span>
              <span className="text-xs shrink-0 ml-auto" style={{ color: 'var(--color-peat-deep)' }}>{note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Styles in context */}
      <section>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-peat-deep)' }}>
          Styles in context
        </p>
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-accent)' }}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-peat-deep)' }}>Page heading</p>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Dashboard</h1>
          </div>
          <div style={{ borderTop: '1px solid var(--color-peat-light)', paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-peat-deep)' }}>Card header</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Hormone levels</p>
          </div>
          <div style={{ borderTop: '1px solid var(--color-peat-light)', paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-peat-deep)' }}>Body text</p>
            <p className="text-sm font-normal leading-relaxed" style={{ color: 'var(--color-peat-deep)' }}>
              Your estrogen is rising, bringing mental clarity and social energy. A great time to schedule important conversations or creative work.
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--color-peat-light)', paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-peat-deep)' }}>Metadata / badge</p>
            <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ background: 'var(--color-peat-light)', color: 'var(--color-peat-deep)' }}>
              High confidence
            </span>
          </div>
          <div style={{ borderTop: '1px solid var(--color-peat-light)', paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-peat-deep)' }}>Sidebar label</p>
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--color-moss-base)' }}>Cycle</span>
          </div>
          <div style={{ borderTop: '1px solid var(--color-peat-light)', paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-peat-deep)' }}>Cycle day number</p>
            <p className="font-semibold leading-none" style={{ fontSize: 'clamp(48px, 8vw, 72px)', color: 'var(--color-phase-luteal)' }}>
              14
            </p>
          </div>
          <div style={{ borderTop: '1px solid var(--color-peat-light)', paddingTop: '1.25rem' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--color-peat-deep)' }}>Stat number</p>
            <p className="text-3xl font-semibold leading-none" style={{ color: 'var(--color-moss-dark)' }}>28</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-peat-deep)' }}>days avg</p>
          </div>
          <div style={{ borderTop: '1px solid var(--color-peat-light)', paddingTop: '1.25rem' }}>
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
