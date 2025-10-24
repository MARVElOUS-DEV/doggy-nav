import Image from 'next/image';

type Wallpaper = { id: string; name: string; src: string };

export default function WallpapersApp({
  items,
  current,
  onPick,
}: {
  items: Wallpaper[];
  current: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="p-4">
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>
        Wallpapers
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {items.map((w) => (
          <button
            key={w.id}
            type="button"
            className="relative rounded-lg overflow-hidden group border border-theme-border hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            onClick={() => onPick(w.id)}
            title={w.name}
          >
            <Image
              src={w.src}
              alt={w.name}
              width={240}
              height={80}
              className="h-24 w-full object-cover"
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
    </div>
  );
}
