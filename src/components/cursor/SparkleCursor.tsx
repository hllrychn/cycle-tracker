import { useEffect, useRef, useCallback } from 'react';

const EMOJIS = ['✨', '✨', '✨', '⭐', '💫'];

let counter = 0;

export function SparkleCursor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const spawnSparkle = useCallback((x: number, y: number) => {
    if (!containerRef.current) return;

    const id = ++counter;
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const scale = 0.7 + Math.random() * 0.7;
    const dx = (Math.random() - 0.5) * 30;

    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-size: ${Math.round(14 + scale * 6)}px;
      line-height: 1;
      pointer-events: none;
      user-select: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      animation: sparkle-float 650ms ease-out forwards;
      --dx: ${dx}px;
    `;
    el.textContent = emoji;
    el.dataset.id = String(id);

    containerRef.current.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      const last = lastPos.current;
      // Only spawn if cursor moved enough (avoids flooding on micro-movements)
      if (last && Math.hypot(x - last.x, y - last.y) < 12) return;
      lastPos.current = { x, y };
      spawnSparkle(x, y);
    };

    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [spawnSparkle]);

  return <div ref={containerRef} aria-hidden="true" />;
}
