import DoggyImage from '@/components/DoggyImage';
import { NavItem } from '@/types';
import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { X } from 'lucide-react';
import api from '@/utils/api';

export default function FavoriteItem({
  item,
  onRemove,
}: {
  item: NavItem;
  onRemove?: (navId: string) => void;
}) {
  const { t } = useTranslation('translation');
  const [jiggle, setJiggle] = React.useState(false);
  const pressTimer = React.useRef<number | null>(null);
  const startPos = React.useRef<{ x: number; y: number } | null>(null);

  const clearTimer = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (jiggle) return;
    startPos.current = { x: e.clientX, y: e.clientY };
    clearTimer();
    pressTimer.current = window.setTimeout(() => {
      setJiggle(true);
    }, 1000);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pressTimer.current || !startPos.current) return;
    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);
    if (dx > 6 || dy > 6) {
      clearTimer();
    }
  };

  const handlePointerUp = () => {
    clearTimer();
  };

  return (
    <div
      className={`relative flex flex-col items-center group cursor-pointer transform transition-all duration-200 hover:scale-110 ${jiggle ? 'animate-sway' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={async (e) => {
        if (jiggle) {
          // In jiggle mode, do not navigate
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        try {
          const id = (item as any).id;
          if (id) {
            await api.updateNavView(String(id));
          }
        } catch {}
        window.open(item.href, '_blank', 'noopener,noreferrer');
      }}
    >
      {jiggle && (
        <button
          aria-label="Close"
          className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
          onClick={(e) => {
            e.stopPropagation();
            const id = (item as any).id || null;
            if (id && onRemove) {
              onRemove(String(id));
            }
            setJiggle(false);
          }}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      <div className="w-16 h-16 bg-white rounded-xl shadow-lg p-2 mb-2 flex items-center justify-center group-hover:shadow-xl transition-shadow duration-200">
        {item.logo ? (
          <DoggyImage
            logo={item.logo}
            name={item.name}
            className="rounded-full flex-shrink-0 w-[48px] h-[48px] object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {item.name?.charAt(0) || 'W'}
          </div>
        )}
      </div>
      <span className="text-sm text-center font-medium max-w-full truncate text-primary-50">
        {item.name}
      </span>
      <span
        className="text-xs text-center mt-1 max-w-full truncate"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        {t(item.categoryName || 'uncategorized', {
          defaultValue: item.categoryName || t('uncategorized'),
        })}
      </span>
    </div>
  );
}
