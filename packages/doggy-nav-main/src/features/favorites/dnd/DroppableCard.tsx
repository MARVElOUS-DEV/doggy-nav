import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';

export default function DroppableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={isOver ? 'ring-2 ring-blue-400 rounded-2xl transition-all' : ''}>
      {children}
    </div>
  );
}
