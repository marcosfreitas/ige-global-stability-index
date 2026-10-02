/** @jest-environment node */
import { ValidationError } from '@/shared/errors';
import { ValidateComposeSpecService } from '../validate-compose-spec.service';

const service = new ValidateComposeSpecService();

const valid = {
  cargo: 'presidente',
  numero: '13',
  frameId: 'vermelha',
};

describe('ValidateComposeSpecService', () => {
  it('accepts a well-formed spec', () => {
    expect(service.execute(valid)).toEqual({
      cargo: 'presidente',
      numero: '13',
      nome: undefined,
      frameId: 'vermelha',
      styleId: 'nenhum',
    });
  });

  it('enforces the digit count of the chosen office', () => {
    expect(() => service.execute({ ...valid, numero: '1' })).toThrow(ValidationError);
    expect(() => service.execute({ ...valid, numero: '133' })).toThrow(ValidationError);
    expect(() =>
      service.execute({ ...valid, cargo: 'deputado-estadual', numero: '12345' })
    ).not.toThrow();
  });

  it('rejects a number that is not digits', () => {
    expect(() => service.execute({ ...valid, numero: '1a' })).toThrow(ValidationError);
    expect(() => service.execute({ ...valid, numero: '1 ' })).toThrow(ValidationError);
    expect(() => service.execute({ ...valid, numero: '' })).toThrow(ValidationError);
  });

  it('rejects unknown offices and frames', () => {
    expect(() => service.execute({ ...valid, cargo: 'prefeito' })).toThrow(ValidationError);
    expect(() => service.execute({ ...valid, frameId: 'dourada' })).toThrow(ValidationError);
  });

  it('normalises whitespace in the typed name', () => {
    expect(service.execute({ ...valid, nome: '  Maria   Silva  ' }).nome).toBe('Maria Silva');
  });

  it('keeps accented names', () => {
    expect(service.execute({ ...valid, nome: 'João Inácio' }).nome).toBe('João Inácio');
  });

  it('treats an empty name as absent', () => {
    expect(service.execute({ ...valid, nome: '   ' }).nome).toBeUndefined();
    expect(service.execute({ ...valid, nome: '' }).nome).toBeUndefined();
  });

  it('defaults to no restyle when the style is absent', () => {
    expect(service.execute(valid).styleId).toBe('nenhum');
  });

  it('accepts a known style and rejects an unknown one', () => {
    expect(service.execute({ ...valid, styleId: 'aquarela' }).styleId).toBe('aquarela');
    expect(() => service.execute({ ...valid, styleId: 'anime' })).toThrow(ValidationError);
  });

  it('rejects markup and over-long names', () => {
    expect(() => service.execute({ ...valid, nome: '<script>x</script>' })).toThrow(
      ValidationError
    );
    expect(() => service.execute({ ...valid, nome: 'a'.repeat(23) })).toThrow(ValidationError);
  });
});
