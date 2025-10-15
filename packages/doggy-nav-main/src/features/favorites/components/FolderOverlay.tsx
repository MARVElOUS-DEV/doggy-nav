import * as React from 'react';
import { NavItem } from '@/types';
import FavoriteItem from './FavoriteItem';
import { X } from 'lucide-react';

export default function FolderOverlay({ name, items, onClose, onRemove }: { name?: string; items: NavItem[]; onClose: () => void; onRemove?: (navId: string) => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl p-6">
          <button
            aria-label="Close"
            className="absolute top-3 right-3 p-2 rounded-full bg-white/70 hover:bg-white shadow"
            onClick={onClose}
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
          {name ? (
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pr-8 truncate">{name}</h3>
          ) : null}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
            {items.map((it) => (
              <FavoriteItem key={(it as any).id || (it as any)._id || it.href} item={it} onRemove={onRemove} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
