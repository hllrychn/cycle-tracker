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
        setTimeout(() => setGone(true), 900);
      }, 3000);
      return () => clearTimeout(delay);
    }
  }, [visible]);

  if (gone) return null;

  return (
    <>
      <style>{`
        @keyframes curtain-blow {
          0%   { transform: translateY(0)      skewX(0deg)  skewY(0deg);  opacity: 1; }
          15%  { transform: translateY(-6%)    skewX(5deg)  skewY(1deg);  opacity: 1; }
          40%  { transform: translateY(-30%)   skewX(10deg) skewY(2deg);  opacity: 1; }
          70%  { transform: translateY(-70%)   skewX(6deg)  skewY(1deg);  opacity: 0.7; }
          100% { transform: translateY(-110%)  skewX(0deg)  skewY(0deg);  opacity: 0; }
        }
        .splash-curtain {
          animation: curtain-blow 900ms cubic-bezier(0.4, 0, 0.8, 0.6) forwards;
        }
      `}</style>
      <div
        className={lifting ? 'splash-curtain' : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2E2820',
          pointerEvents: lifting ? 'none' : 'auto',
          transformOrigin: 'bottom center',
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
    </>
  );
}
