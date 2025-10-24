import * as React from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { NavItem } from '@/types';
import FavoriteItem from './FavoriteItem';
import { X } from 'lucide-react';
import FavoritesLayout from './FavoritesLayout';
import DraggableCard from '../dnd/DraggableCard';
import DroppableCard from '../dnd/DroppableCard';

export default function FolderOverlay({
  name,
  items,
  onClose,
  onRemove,
  onMoveOut,
}: {
  name?: string;
  items: NavItem[];
  onClose: () => void;
  onRemove?: (navId: string) => void;
  onMoveOut?: (navId: string) => void;
}) {
  const getNavId = (item: NavItem) =>
    String((item as any).id ?? item.href ?? item.name ?? 'nav-item');

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!onMoveOut) return;
    const { active, over } = event;
    // If dropped outside any droppable within the folder overlay, treat as move out
    if (!over) {
      onMoveOut(String(active.id));
    }
  };

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
          <FavoritesLayout onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
              {items.map((it) => (
                <DroppableCard key={getNavId(it)} id={getNavId(it)}>
                  <DraggableCard id={getNavId(it)}>
                    <FavoriteItem item={it} onRemove={onRemove} />
                  </DraggableCard>
                </DroppableCard>
              ))}
            </div>
          </FavoritesLayout>
        </div>
      </div>
    </div>
  );
}
