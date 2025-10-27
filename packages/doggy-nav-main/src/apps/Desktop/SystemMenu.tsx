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

  const currentWp = useMemo(
    () => wallpapers.find((w) => w.id === current) || wallpapers[0],
    [current, wallpapers]
  );
  const currentName = currentWp?.name || 'Wallpaper';
  const featured = useMemo(() => {
    // Show a small curated set to avoid rendering dozens in the quick menu
    const idx = wallpapers.findIndex((w) => w.id === current);
    const around = wallpapers.slice(Math.max(0, idx - 4), idx).concat(wallpapers.slice(idx + 1, idx + 7));
    const base = around.length >= 8 ? around.slice(0, 8) : wallpapers.slice(0, 8);
    return base;
  }, [wallpapers, current]);

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

        {/* Wallpaper quick section - condensed cards */}
        <div className="px-3 py-2 border-b border-theme-border">
          <div className="text-sm mb-2" style={{ color: 'var(--color-foreground)' }}>
            Wallpapers
          </div>
          {/* Current wallpaper card */}
          <button
            type="button"
            onClick={() => (onOpenWallpapers ? onOpenWallpapers() : onPick(current))}
            className="w-full rounded-xl border border-theme-border glass-light dark:glass-dark p-2 flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/10 transition-colors mb-3"
            title={currentName}
          >
            {currentWp && (
              <Image
                src={currentWp.src}
                alt={currentName}
                width={72}
                height={48}
                className="h-14 w-24 object-cover rounded-md"
              />
            )}
            <div className="min-w-0">
              <div className="text-sm truncate" style={{ color: 'var(--color-foreground)' }}>
                {currentName}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--color-muted-foreground)' }}>
                Current wallpaper
              </div>
            </div>
          </button>

          {/* Featured strip */}
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden py-2">
            {featured.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => onPick(w.id)}
                className="relative rounded-lg overflow-hidden flex-shrink-0 group border border-theme-border my-0.5"
                style={{ width: 90, height: 56 }}
                title={w.name}
              >
                <Image src={w.src} alt={w.name} width={90} height={56} className="object-cover" />
                {current === w.id && (
                  <span
                    className="absolute inset-0 border-2 rounded-lg"
                    style={{ borderColor: 'var(--color-primary)' }}
                  />
                )}
              </button>
            ))}
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
