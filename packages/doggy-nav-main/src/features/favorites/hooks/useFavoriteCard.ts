import { PointerSensor, useSensor, useSensors, type CollisionDetection, pointerWithin } from '@dnd-kit/core';

export function useFavoriteCard() {
  const sensors = useSensors(useSensor(PointerSensor));
  const collisionDetection: CollisionDetection = pointerWithin;
  return { sensors, collisionDetection };
}

export default useFavoriteCard;
