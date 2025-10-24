import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAtom } from 'jotai';
import { themeAtom } from '@/store/store';
import Image from 'next/image';

type Wallpaper = { id: string; name: string; src: string };

export default function SystemMenu({
  open,
  onClose,
  wallpapers,
  current,
  onPick,
  onOpenWallpapers,
}: {
  open: boolean;
  onClose: () => void;
  wallpapers: Wallpaper[];
  current: string;
  onPick: (id: string) => void;
  onOpenWallpapers?: () => void;
}) {
  const [theme, setTheme] = useAtom(themeAtom);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleTheme = useCallback(
    () => setTheme(theme === 'light' ? 'dark' : 'light'),
    [theme, setTheme]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [open, onClose]);

  const currentName = useMemo(
    () => wallpapers.find((w) => w.id === current)?.name ?? 'Wallpaper',
    [current, wallpapers]
  );

  if (!open) return null;

  return (
    <div className="fixed top-10 right-3 z-[80]">
      <div
        ref={containerRef}
        className="rounded-2xl border border-theme-border glass-light dark:glass-dark backdrop-blur-xl shadow-2xl w-80 select-none overflow-hidden"
      >
        {/* Theme toggle */}
        <div className="px-3 py-2 border-b border-theme-border flex items-center justify-between">
          <div className="text-sm" style={{ color: 'var(--color-foreground)' }}>
            Theme
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="text-xs px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? 'Light → Dark' : 'Dark → Light'}
          </button>
        </div>

        {/* Wallpaper picker */}
        <div className="px-3 py-2 border-b border-theme-border">
          <div className="text-sm mb-2" style={{ color: 'var(--color-foreground)' }}>
            Wallpaper
          </div>
          <div className="grid grid-cols-3 gap-2">
            {wallpapers.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onPick(w.id)}
                className="relative rounded-lg overflow-hidden group"
                title={w.name}
              >
                <Image
                  src={w.src}
                  alt={w.name}
                  width="100"
                  height={'64'}
                  className="h-16 w-full object-cover"
                />
                {current === w.id && (
                  <span
                    className="absolute inset-0 border-2 rounded-lg"
                    style={{ borderColor: 'var(--color-primary)' }}
                  />
                )}
                <span className="absolute bottom-0 left-0 right-0 text-[10px] p-1 bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {w.name}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            Current: {currentName}
          </div>
          {onOpenWallpapers && (
            <div className="mt-2 text-right">
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                onClick={onOpenWallpapers}
              >
                Open Wallpapers…
              </button>
            </div>
          )}
        </div>

        {/* Close */}
        <div className="px-3 py-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
