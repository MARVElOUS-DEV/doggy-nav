import * as React from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import useFavoriteCard from '../hooks/useFavoriteCard';

export default function FavoritesLayout({ children, onDragEnd }: { children: React.ReactNode; onDragEnd?: (e: DragEndEvent) => void }) {
  const { sensors, collisionDetection } = useFavoriteCard();
  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  );
}
