import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const inputStyle = {
  border: '1px solid var(--color-peat-mid)',
  background: 'var(--color-peat-light)',
  color: 'var(--color-text-primary)',
};

export function ContactPage() {
  const { user } = useAuth();

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent]       = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    const sub  = encodeURIComponent(subject || 'Cycle Tracker feedback');
    window.location.href = `mailto:hllrychn@gmail.com?subject=${sub}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="font-semibold text-3xl md:text-[42px]" style={{ color: 'var(--color-text-primary)' }}>Contact</h1>
        <p className="text-sm mt-0.5" style={{ color: '#F0EDE6' }}>Send feedback or get in touch</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(46,40,32,0.08)', borderLeft: '4px solid var(--color-moss-base)' }}>
        {sent ? (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="text-2xl">✉️</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Your email client should have opened.</p>
            <p className="text-xs" style={{ color: 'var(--color-peat-deep)' }}>If it didn't, email us directly at hllrychn@gmail.com</p>
            <button
              onClick={() => setSent(false)}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg"
              style={{ color: 'var(--color-moss-dark)', background: 'var(--color-moss-light)' }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-peat-deep)' }}>Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-peat-deep)' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-peat-deep)' }}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="What's this about?"
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-peat-deep)' }}>Message</label>
              <textarea
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind…"
                rows={5}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 text-white font-medium rounded-lg text-sm transition-colors"
              style={{ background: 'var(--color-moss-base)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-moss-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-moss-base)')}
            >
              Send message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
