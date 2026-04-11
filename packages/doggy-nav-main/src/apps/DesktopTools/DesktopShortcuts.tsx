import Image from 'next/image';

export type DesktopShortcutItem = {
  key: string;
  label: string;
  description?: string;
  iconSrc: string;
  iconClass?: string;
  running?: boolean;
  onOpen: () => void;
};

export default function DesktopShortcuts({
  items,
  topOffset,
  bottomOffset,
  hidden = false,
}: {
  items: DesktopShortcutItem[];
  topOffset: number;
  bottomOffset: number;
  hidden?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={`pointer-events-none fixed left-0 z-[25] p-4 transition-opacity duration-200 ${
        hidden ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        top: topOffset,
        bottom: bottomOffset,
        width: 'min(13rem, 100vw)',
      }}
    >
      <div className="flex h-full flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onOpen}
            className="pointer-events-auto group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left backdrop-blur-xl transition-all hover:-translate-y-0.5"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-border) 70%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--color-card) 22%, transparent)',
              color: 'var(--color-foreground)',
              boxShadow: '0 14px 40px rgba(0, 0, 0, 0.12)',
            }}
            aria-label={`Open ${item.label}`}
            title={item.description ? `${item.label}: ${item.description}` : item.label}
          >
            <div className="relative h-12 w-12 shrink-0">
              <Image
                src={item.iconSrc}
                alt={item.label}
                fill
                className={`${item.iconClass ?? ''} object-contain`}
              />
              {item.running ? (
                <span
                  className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{item.label}</div>
              {item.description ? (
                <div className="mt-0.5 line-clamp-2 text-xs">{item.description}</div>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
