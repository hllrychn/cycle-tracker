import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function LoginForm() {
  const { signInWithPassword, signUp, signInWithOtp } = useAuth();
  const [tab, setTab] = useState<'password' | 'magic'>('password');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setSuccess('Check your email to confirm your account.');
      } else {
        await signInWithPassword(email, password);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithOtp(email);
      setSuccess('Magic link sent! Check your email.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]';

  return (
    <div
      className="rounded-2xl p-8 w-full max-w-sm"
      style={{ background: '#FFFFFF', boxShadow: '0 4px 24px rgba(46,40,32,0.12)' }}
    >
      <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Welcome</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-peat-deep)' }}>Track your cycle with privacy.</p>

      {/* Tabs */}
      <div className="flex rounded-lg p-1 mb-6" style={{ background: 'var(--color-peat-mid)' }}>
        {(['password', 'magic'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); setSuccess(null); }}
            className="flex-1 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={tab === t
              ? { background: 'var(--color-peat-light)', color: 'var(--color-text-primary)' }
              : { color: 'var(--color-peat-deep)' }
            }
          >
            {t === 'password' ? 'Password' : 'Magic link'}
          </button>
        ))}
      </div>

      {tab === 'password' ? (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            style={{ border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)', color: 'var(--color-text-primary)' }}
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            style={{ border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)', color: 'var(--color-text-primary)' }}
          />
          {error && <p className="text-sm" style={{ color: 'var(--color-accent-dark)' }}>{error}</p>}
          {success && <p className="text-sm" style={{ color: 'var(--color-moss-base)' }}>{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-moss-base)' }}
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          <button
            type="button"
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setSuccess(null); }}
            className="w-full text-sm"
            style={{ color: 'var(--color-peat-deep)' }}
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            style={{ border: '1px solid var(--color-peat-mid)', background: 'var(--color-peat-light)', color: 'var(--color-text-primary)' }}
          />
          {error && <p className="text-sm" style={{ color: 'var(--color-accent-dark)' }}>{error}</p>}
          {success && <p className="text-sm" style={{ color: 'var(--color-moss-base)' }}>{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60"
            style={{ background: 'var(--color-moss-base)' }}
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      )}
    </div>
  );
}
