import { randomBytes } from 'node:crypto';
import { toBrlDecimalString } from '@/config/pricing';
import type { IPixProvider } from '@/core/orders/contracts';
import type { PixCharge } from '@/core/orders/entities/order';
import { assertEnv } from '@/shared/config/assert-env';
import { ExternalApiError } from '@/shared/errors';
import { efiAuthorizedWithRetry } from './efi-http';

interface CobResponse {
  txid: string;
  status: string;
  pixCopiaECola?: string;
  loc?: { id: number; location?: string };
  valor?: { original: string };
  pix?: { valor: string }[];
}

interface QrCodeResponse {
  qrcode: string;
  imagemQrcode: string;
}

/** EFI accepts 26–35 chars of [a-zA-Z0-9] as the charge id. */
function generateTxid(): string {
  return randomBytes(16).toString('hex').slice(0, 32);
}

function parseBrlToCents(value: string | undefined): number {
  if (!value) return 0;
  return Math.round(Number.parseFloat(value) * 100);
}

export class EfiPixProvider implements IPixProvider {
  async createCharge({
    amountCents,
    expiresInSeconds,
    reference,
  }: {
    amountCents: number;
    expiresInSeconds: number;
    reference: string;
  }): Promise<PixCharge> {
    const txid = generateTxid();

    const cob = await efiAuthorizedWithRetry<CobResponse>({
      method: 'PUT',
      path: `/v2/cob/${txid}`,
      body: {
        calendario: { expiracao: expiresInSeconds },
        valor: { original: toBrlDecimalString(amountCents) },
        chave: assertEnv('EFI_PIX_KEY'),
        solicitacaoPagador: reference.slice(0, 140),
      },
    });

    // One call: the QR image is always needed, and it carries the
    // copia-e-cola payload as a fallback when the cob response omits it.
    const qr = await this.fetchQrCode(cob);
    const qrCodeText = cob.pixCopiaECola ?? qr.qrcode;
    const qrCodeImage = qr.imagemQrcode;

    if (!qrCodeText) {
      throw new ExternalApiError('EFI', 'Cobrança criada sem payload copia-e-cola.');
    }

    return {
      txid: cob.txid ?? txid,
      qrCodeText,
      qrCodeImage,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  async isChargeSettled({
    txid,
    expectedAmountCents,
  }: {
    txid: string;
    expectedAmountCents: number;
  }): Promise<boolean> {
    const cob = await efiAuthorizedWithRetry<CobResponse>({
      method: 'GET',
      path: `/v2/cob/${txid}`,
    });

    if (cob.status !== 'CONCLUIDA') return false;

    // Guard against a charge settled for less than it asked for.
    const received = (cob.pix ?? []).reduce((sum, entry) => sum + parseBrlToCents(entry.valor), 0);
    const expected = parseBrlToCents(cob.valor?.original) || expectedAmountCents;

    return received >= Math.min(expected, expectedAmountCents);
  }

  private async fetchQrCode(cob: CobResponse): Promise<QrCodeResponse> {
    if (!cob.loc?.id) {
      throw new ExternalApiError('EFI', 'Cobrança criada sem location para QR Code.');
    }
    return efiAuthorizedWithRetry<QrCodeResponse>({
      method: 'GET',
      path: `/v2/loc/${cob.loc.id}/qrcode`,
    });
  }
}
