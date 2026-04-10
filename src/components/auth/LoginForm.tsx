import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function LoginForm() {
  const { signInWithPassword, signUp, signInWithOtp, signInWithGoogle } = useAuth();
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

      {/* Google */}
      <button
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-3 py-2 rounded-lg text-sm font-medium mb-4 transition-colors"
        style={{ border: '1px solid var(--color-peat-mid)', background: '#fff', color: 'var(--color-text-primary)' }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'var(--color-peat-mid)' }} />
        <span className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-peat-mid)' }} />
      </div>

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
