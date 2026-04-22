import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
}

export function SplashScreen({ visible }: Props) {
  const [fading, setFading] = useState(false);
  const [gone,   setGone]   = useState(false);

  useEffect(() => {
    if (!visible) {
      setFading(true);
      const t = setTimeout(() => setGone(true), 500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (gone) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2E2820',
        transition: 'opacity 500ms ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <img
        src="/pwa-192x192.png"
        alt="Cycle Tracker"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          marginBottom: '20px',
          opacity: fading ? 0 : 1,
          transform: fading ? 'scale(0.92)' : 'scale(1)',
          transition: 'opacity 500ms ease, transform 500ms ease',
        }}
      />
      <p
        style={{
          fontFamily: 'inherit',
          fontSize: '13px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#9E9A3C',
          opacity: fading ? 0 : 1,
          transition: 'opacity 400ms ease',
        }}
      >
        cycle tracker
      </p>
    </div>
  );
}
