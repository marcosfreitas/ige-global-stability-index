import { ValidationError } from '@/shared/errors';
import {
  MAX_NOME_LENGTH,
  findCargo,
  isCargoId,
  type ComposeSpec,
} from '../entities/composition';
import { findFrame, isFrameId } from '../entities/frame';
import { DEFAULT_STYLE_ID, isStyleId } from '../entities/style';

const DIGITS_ONLY = /^[0-9]+$/;
/** Letters (incl. accents), spaces, dot, hyphen and apostrophe. */
const NOME_ALLOWED = /^[\p{L}\p{M} .'-]+$/u;

/**
 * The only gate between client input and the renderer. Returns a normalised
 * spec; never mutates its argument.
 */
export class ValidateComposeSpecService {
  execute(input: {
    cargo: unknown;
    numero: unknown;
    nome?: unknown;
    frameId: unknown;
    styleId?: unknown;
  }): ComposeSpec {
    if (!isCargoId(input.cargo)) {
      throw new ValidationError('Cargo inválido.');
    }
    if (!isFrameId(input.frameId)) {
      throw new ValidationError('Moldura inválida.');
    }

    // Absent means "no restyle", so an older client keeps working.
    const styleId = input.styleId === undefined ? DEFAULT_STYLE_ID : input.styleId;
    if (!isStyleId(styleId)) {
      throw new ValidationError('Estilo inválido.');
    }

    const cargo = findCargo(input.cargo);
    const frame = findFrame(input.frameId);
    if (!cargo || !frame) {
      throw new ValidationError('Cargo ou moldura inválido.');
    }

    if (typeof input.numero !== 'string' || !DIGITS_ONLY.test(input.numero)) {
      throw new ValidationError('O número deve conter apenas dígitos.');
    }
    if (input.numero.length !== cargo.digits) {
      throw new ValidationError(
        `Número de ${cargo.label} tem ${cargo.digits} dígitos.`
      );
    }

    let nome: string | undefined;
    if (input.nome !== undefined && input.nome !== null && input.nome !== '') {
      if (typeof input.nome !== 'string') {
        throw new ValidationError('Nome inválido.');
      }
      nome = input.nome.trim().replace(/\s+/g, ' ');
      if (nome.length === 0) {
        nome = undefined;
      } else {
        if (nome.length > MAX_NOME_LENGTH) {
          throw new ValidationError(`O nome deve ter até ${MAX_NOME_LENGTH} caracteres.`);
        }
        if (!NOME_ALLOWED.test(nome)) {
          throw new ValidationError('O nome contém caracteres não permitidos.');
        }
      }
    }

    return { cargo: cargo.id, numero: input.numero, nome, frameId: frame.id, styleId };
  }
}
