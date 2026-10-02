import { randomBytes } from 'node:crypto';
import { toBrlDecimalString } from '@/config/pricing';
import type { IPixProvider } from '@/core/orders/contracts';
import type { PixCharge } from '@/core/orders/entities/order';

/**
 * Local-development stand-in so the whole flow can be exercised before the
 * EFI certificate exists. Charges settle on a timer. Never reachable in
 * production: the factory only returns it when EFI_FAKE_PIX is on AND
 * NODE_ENV is not production.
 */
const charges = new Map<string, { settleAt: number; amountCents: number }>();

function settleDelayMs(): number {
  const raw = Number.parseInt(process.env.EFI_FAKE_SETTLE_SECONDS ?? '', 10);
  return (Number.isInteger(raw) && raw >= 0 ? raw : 8) * 1000;
}

export class FakePixProvider implements IPixProvider {
  async createCharge({
    amountCents,
    expiresInSeconds,
  }: {
    amountCents: number;
    expiresInSeconds: number;
    reference: string;
  }): Promise<PixCharge> {
    const txid = randomBytes(16).toString('hex');
    charges.set(txid, { settleAt: Date.now() + settleDelayMs(), amountCents });

    return {
      txid,
      qrCodeText: `00020126FAKE-PIX-${txid.slice(0, 12).toUpperCase()}-BRL${toBrlDecimalString(
        amountCents
      )}`,
      qrCodeImage: '',
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  async isChargeSettled({ txid }: { txid: string; expectedAmountCents: number }): Promise<boolean> {
    const charge = charges.get(txid);
    if (!charge) return false;
    return Date.now() >= charge.settleAt;
  }
}

/**
 * Allowed everywhere except a real production deployment.
 *
 * Keying this off NODE_ENV alone would be wrong on Vercel, which sets
 * NODE_ENV=production on preview deployments too — the fake would be dead
 * exactly where it is most useful. VERCEL_ENV is the honest signal when it is
 * present; off Vercel we fall back to NODE_ENV.
 */
export function isFakePixEnabled(): boolean {
  if (process.env.EFI_FAKE_PIX !== 'true') return false;

  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv !== 'production';

  return process.env.NODE_ENV !== 'production';
}
