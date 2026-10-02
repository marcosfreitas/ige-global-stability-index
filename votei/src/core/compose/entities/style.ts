/**
 * Optional AI restyling of the photo, applied *before* the frame.
 *
 * The number is never drawn by the model. Image models misrender digits, and
 * the digit is the whole point of the product, so it stays with satori. The
 * model only restyles the portrait.
 */

export const STYLE_IDS = ['nenhum', 'aquarela', 'pop-art', 'grafite', 'vitral'] as const;

export type StyleId = (typeof STYLE_IDS)[number];

export interface PhotoStyle {
  id: StyleId;
  label: string;
  /** Empty for `nenhum`, which skips the model entirely. */
  prompt: string;
}

/**
 * Every prompt pins the same three constraints: keep the person recognisable,
 * add no text, add no political or party imagery. The first keeps it a photo
 * of the buyer; the other two keep the model from inventing marks the product
 * has no right to use.
 */
const CONSTRAINTS =
  'Keep the person clearly recognisable, same face, same pose, same framing. ' +
  'Do not add any text, letters, numbers, logos, flags, party symbols or political imagery. ' +
  'Output a single portrait image.';

export const STYLES: readonly PhotoStyle[] = [
  { id: 'nenhum', label: 'Foto original', prompt: '' },
  {
    id: 'aquarela',
    label: 'Aquarela',
    prompt: `Repaint this portrait as a loose watercolour painting with soft washes and visible paper texture. ${CONSTRAINTS}`,
  },
  {
    id: 'pop-art',
    label: 'Pop art',
    prompt: `Restyle this portrait as bold pop-art with flat saturated colour blocks, heavy outlines and halftone dots. ${CONSTRAINTS}`,
  },
  {
    id: 'grafite',
    label: 'Grafite',
    prompt: `Restyle this portrait as a street-art stencil on a concrete wall, high contrast, spray-paint texture. ${CONSTRAINTS}`,
  },
  {
    id: 'vitral',
    label: 'Vitral',
    prompt: `Restyle this portrait as a stained-glass window with dark leading lines between luminous colour panes. ${CONSTRAINTS}`,
  },
];

export const DEFAULT_STYLE_ID: StyleId = 'nenhum';

export function isStyleId(value: unknown): value is StyleId {
  return typeof value === 'string' && (STYLE_IDS as readonly string[]).includes(value);
}

export function findStyle(id: string): PhotoStyle | undefined {
  return STYLES.find((style) => style.id === id);
}

export function requiresModel(id: StyleId): boolean {
  return id !== 'nenhum';
}
