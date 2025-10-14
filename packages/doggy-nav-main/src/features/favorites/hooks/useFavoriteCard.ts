import { PointerSensor, useSensor, useSensors, type CollisionDetection, pointerWithin } from '@dnd-kit/core';

export function useFavoriteCard() {
  // Add activation constraint so clicks don't immediately start dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  const collisionDetection: CollisionDetection = pointerWithin;
  return { sensors, collisionDetection };
}

export default useFavoriteCard;
