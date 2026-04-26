import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
}

export function SplashScreen({ visible }: Props) {
  const [lifting, setLifting] = useState(false);
  const [gone,    setGone]    = useState(false);

  useEffect(() => {
    if (!visible) {
      const delay = setTimeout(() => {
        setLifting(true);
        setTimeout(() => setGone(true), 700);
      }, 3000);
      return () => clearTimeout(delay);
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
        transform: lifting ? 'translateY(-100%)' : 'translateY(0)',
        transition: lifting ? 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        pointerEvents: lifting ? 'none' : 'auto',
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
        }}
      />
      <p
        style={{
          fontFamily: 'inherit',
          fontSize: '13px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#9E9A3C',
        }}
      >
        cycle tracker
      </p>
    </div>
  );
}
