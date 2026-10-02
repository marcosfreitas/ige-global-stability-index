import type { FrameId } from './frame';
import type { StyleId } from './style';

/**
 * Ballot number length is fixed per office in Brazil, so the office doubles as
 * the validation rule for the number the voter types.
 */
export const CARGO_IDS = [
  'presidente',
  'governador',
  'senador',
  'deputado-federal',
  'deputado-estadual',
] as const;

export type CargoId = (typeof CARGO_IDS)[number];

export interface Cargo {
  id: CargoId;
  label: string;
  /** Exact number of digits on the ballot for this office. */
  digits: number;
}

export const CARGOS: readonly Cargo[] = [
  { id: 'presidente', label: 'Presidente', digits: 2 },
  { id: 'governador', label: 'Governador', digits: 2 },
  { id: 'senador', label: 'Senador', digits: 3 },
  { id: 'deputado-federal', label: 'Deputado Federal', digits: 4 },
  { id: 'deputado-estadual', label: 'Deputado Estadual', digits: 5 },
];

export const DEFAULT_CARGO_ID: CargoId = 'presidente';

export const MAX_NOME_LENGTH = 22;

export interface ComposeSpec {
  cargo: CargoId;
  /** Digits only, length enforced against the office. */
  numero: string;
  /** Optional label the voter types themselves. Never sourced from a catalogue. */
  nome?: string;
  frameId: FrameId;
  styleId: StyleId;
}

export function isCargoId(value: unknown): value is CargoId {
  return typeof value === 'string' && (CARGO_IDS as readonly string[]).includes(value);
}

export function findCargo(id: string): Cargo | undefined {
  return CARGOS.find((cargo) => cargo.id === id);
}
