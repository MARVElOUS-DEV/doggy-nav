export const CREATIVE_TRIGGER_STORAGE_KEY = 'doggy-nav:creative-trigger';

export type CreativeTriggerVariant = 'lightbulb-rope' | 'paper-plane' | 'portal-slider';

export const creativeTriggerOptions = [
  {
    id: 'lightbulb-rope',
    nameKey: 'creative_trigger_lightbulb_name',
    descriptionKey: 'creative_trigger_lightbulb_description',
    preview: '💡',
  },
  {
    id: 'paper-plane',
    nameKey: 'creative_trigger_plane_name',
    descriptionKey: 'creative_trigger_plane_description',
    preview: '➤',
  },
  {
    id: 'portal-slider',
    nameKey: 'creative_trigger_portal_name',
    descriptionKey: 'creative_trigger_portal_description',
    preview: '◉',
  },
] as const satisfies ReadonlyArray<{
  id: CreativeTriggerVariant;
  nameKey: string;
  descriptionKey: string;
  preview: string;
}>;

export const normalizeCreativeTriggerVariant = (value: unknown): CreativeTriggerVariant =>
  creativeTriggerOptions.some((option) => option.id === value)
    ? (value as CreativeTriggerVariant)
    : 'lightbulb-rope';

export function isCreativeTriggerGestureComplete(
  variant: CreativeTriggerVariant,
  offset: { x: number; y: number },
  portalDistance = 132
) {
  if (variant === 'lightbulb-rope') return offset.y >= 100;
  if (variant === 'paper-plane') return offset.x <= -80 && offset.y >= 80;
  return offset.x >= portalDistance * 0.85;
}
