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
          0%   { transform: translate(0, 0)         skewX(0deg)   skewY(0deg)  rotate(0deg);   opacity: 1; }
          15%  { transform: translate(-8%, -5%)     skewX(4deg)   skewY(2deg)  rotate(-1deg);  opacity: 1; }
          40%  { transform: translate(-30%, -25%)   skewX(14deg)  skewY(6deg)  rotate(-4deg);  opacity: 1; }
          70%  { transform: translate(-70%, -65%)   skewX(18deg)  skewY(9deg)  rotate(-6deg);  opacity: 0.6; }
          100% { transform: translate(-115%, -115%) skewX(20deg)  skewY(10deg) rotate(-8deg);  opacity: 0; }
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
          transformOrigin: 'bottom right',
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
