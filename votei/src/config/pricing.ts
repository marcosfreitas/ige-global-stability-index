/**
 * Single price per generation. Kept in one place so a price test is one env
 * var and a redeploy, never a code change.
 */
export const DEFAULT_PRICE_BRL_CENTS = 290;

export function getPriceBrlCents(): number {
  const raw = process.env.PRICE_BRL_CENTS;
  if (!raw) return DEFAULT_PRICE_BRL_CENTS;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 100 || parsed > 10_000) {
    return DEFAULT_PRICE_BRL_CENTS;
  }
  return parsed;
}

/** EFI expects `valor.original` as a decimal string with two places. */
export function toBrlDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatBrl(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
