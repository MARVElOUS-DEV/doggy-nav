import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export type DockItem = {
  key: string;
  label: string;
  iconSrc: string;
  onClick?: () => void;
  href?: string;
  running?: boolean;
};

export default function Dock({ items }: { items: DockItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  const onMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    setMouseX(e.clientX);
  };
  const onLeave = () => setMouseX(null);

  // Global listener limited strictly to inside the dock container bounds
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      setMouseX(inside ? e.clientX : null);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const hoverIntensity = mouseX == null ? 0 : 1; // simple presence-based intensity
  // macOS-like: bar stretches slightly in X only; no vertical lift/scale
  const barScaleX = 1 + 0.04 * hoverIntensity;
  const barScaleY = 1;

  return (
    <div className="pointer-events-none fixed left-0 right-0 bottom-4 z-[60] flex justify-center">
      <div
        ref={containerRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="pointer-events-auto glass-dark border border-theme-border rounded-2xl px-3 py-2 shadow-xl flex gap-2"
        style={{
          transform: `scale(${barScaleX}, ${barScaleY})`,
          transformOrigin: 'bottom center',
          transition: 'transform 160ms ease-out',
          willChange: 'transform',
        }}
      >
        {items.map((it, idx) => (
          <DockButton key={it.key} item={it} mouseX={mouseX} />
        ))}
      </div>
    </div>
  );
}
const calcScale = (dx: number, limit: number) => {
  const d = Math.min(Math.abs(dx), limit);
  // Peaks at center ~2x, falloff towards edges
  const t = 1 - d / limit; // 1..0
  return 1 + t * t; // 1..2
};
function DockButton({ item, mouseX }: { item: DockItem; mouseX: number | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const base = 36; // px
  const { scale, lift } = useMemo(() => {
    const limit = base * 6;
    if (!ref.current || mouseX == null) return { scale: 1, lift: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const dx = mouseX - centerX; // >0 mouse on right side
    const scaleVal = calcScale(dx, limit);
    const maxScale = 2;
    const liftMax = 16; // px upward
    const lift = ((scaleVal - 1) / (maxScale - 1)) * liftMax;
    return { scale: scaleVal, lift };
  }, [mouseX]);
  const zIndex = useMemo(() => 10 + Math.round((scale - 1) * 100), [scale]);

  return (
    <button
      type="button"
      aria-label={`Open ${item.label}`}
      onClick={item.onClick}
      className="group relative inline-flex flex-col items-center gap-0 px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      style={{ zIndex }}
    >
      <div
        ref={ref}
        className="relative"
        style={{
          width: base,
          height: base,
          transform: `translate(0px, ${-lift}px) scale(${scale})`,
          transformOrigin: 'bottom center',
          transition: 'transform 140ms ease-out',
          willChange: 'transform',
        }}
      >
        {/* Tooltip */}
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="px-2 py-1 rounded-md border border-theme-border shadow-xl glass-light dark:glass-dark text-xs whitespace-nowrap"
            style={{ color: 'var(--color-foreground)' }}
          >
            {item.label}
          </div>
        </div>
        <Image src={item.iconSrc} alt={item.label} fill className="object-contain" />
        {item.running && (
          <span
            className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ backgroundColor: 'var(--color-foreground)', opacity: 0.85 }}
          />
        )}
      </div>
    </button>
  );
}
