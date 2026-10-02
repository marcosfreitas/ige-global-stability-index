/**
 * Frame catalogue — pure data. Frames are named by their look, never by a
 * candidate, party or acronym: the number the voter types is what identifies
 * the vote, and shipping party marks or candidate likenesses would put
 * third-party rights into a product that does not need them.
 */

export const FRAME_IDS = [
  'verde-amarela',
  'vermelha',
  'azul',
  'rosa',
  'laranja',
  'preta',
  'neon',
] as const;

export type FrameId = (typeof FRAME_IDS)[number];

export type FrameMotif = 'flag' | 'solid' | 'gradient' | 'stripes';

export interface FramePalette {
  /** Outer ring, and the fallback flat colour. */
  ring: string;
  /** Second stop for gradient and stripe motifs. */
  ringAlt: string;
  banner: string;
  bannerText: string;
  accent: string;
}

export interface Frame {
  id: FrameId;
  label: string;
  motif: FrameMotif;
  palette: FramePalette;
}

export const FRAMES: readonly Frame[] = [
  {
    id: 'verde-amarela',
    label: 'Verde e amarela',
    motif: 'flag',
    palette: {
      ring: '#009C3B',
      ringAlt: '#FFDF00',
      banner: '#002776',
      bannerText: '#FFFFFF',
      accent: '#FFDF00',
    },
  },
  {
    id: 'vermelha',
    label: 'Vermelha',
    motif: 'solid',
    palette: {
      ring: '#D3252A',
      ringAlt: '#8C1115',
      banner: '#8C1115',
      bannerText: '#FFFFFF',
      accent: '#FFD8D9',
    },
  },
  {
    id: 'azul',
    label: 'Azul',
    motif: 'solid',
    palette: {
      ring: '#1B50C8',
      ringAlt: '#0A2A75',
      banner: '#0A2A75',
      bannerText: '#FFFFFF',
      accent: '#CFE0FF',
    },
  },
  {
    id: 'rosa',
    label: 'Rosa',
    motif: 'gradient',
    palette: {
      ring: '#FF2D87',
      ringAlt: '#7A1350',
      banner: '#7A1350',
      bannerText: '#FFFFFF',
      accent: '#FFD4E8',
    },
  },
  {
    id: 'laranja',
    label: 'Laranja',
    motif: 'gradient',
    palette: {
      ring: '#FF7A00',
      ringAlt: '#A33D00',
      banner: '#A33D00',
      bannerText: '#FFFFFF',
      accent: '#FFE2C4',
    },
  },
  {
    id: 'preta',
    label: 'Preta',
    motif: 'solid',
    palette: {
      ring: '#111111',
      ringAlt: '#333333',
      banner: '#000000',
      bannerText: '#FFFFFF',
      accent: '#BBBBBB',
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    motif: 'stripes',
    palette: {
      ring: '#7C3AED',
      ringAlt: '#06B6D4',
      banner: '#1A0B38',
      bannerText: '#FFFFFF',
      accent: '#22D3EE',
    },
  },
];

export const DEFAULT_FRAME_ID: FrameId = 'verde-amarela';

export function isFrameId(value: unknown): value is FrameId {
  return typeof value === 'string' && (FRAME_IDS as readonly string[]).includes(value);
}

export function findFrame(id: string): Frame | undefined {
  return FRAMES.find((frame) => frame.id === id);
}
