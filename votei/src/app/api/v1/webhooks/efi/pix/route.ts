import { NextRequest, NextResponse } from 'next/server';
import { ConfirmPaymentService } from '@/core/orders/services/confirm-payment.service';
import { createAdminClient } from '@/infrastructure/database/admin';
import { createPixProvider } from '@/infrastructure/payments/pix.factory';
import { OrderRepository } from '@/infrastructure/repositories/order.repository';

export const runtime = 'nodejs';

/**
 * EFI appends `/pix` to the registered webhook URL, hence the path.
 *
 * The body is treated as a hint and nothing more: it names a txid, and the
 * service then asks EFI directly whether that charge settled. A forged POST
 * therefore buys a wasted API call, not a free render. This is why no shared
 * secret is required here — the authority is the PSP, not the request.
 */
export async function POST(req: NextRequest) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const txids = extractTxids(payload);
  if (txids.length === 0) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const service = new ConfirmPaymentService(
    new OrderRepository(createAdminClient()),
    createPixProvider()
  );

  // Always 200: EFI retries on a non-2xx, and a transient failure here is
  // recovered by the client's own status polling.
  await Promise.all(
    txids.slice(0, 50).map(async (txid) => {
      try {
        await service.execute({ txid });
      } catch (err) {
        console.error('[webhook:efi] confirmation failed for txid', txid, err);
      }
    })
  );

  return NextResponse.json({ received: true }, { status: 200 });
}

function extractTxids(payload: unknown): string[] {
  if (typeof payload !== 'object' || payload === null) return [];

  const entries = (payload as { pix?: unknown }).pix;
  if (!Array.isArray(entries)) return [];

  const txids = new Set<string>();
  for (const entry of entries) {
    const txid = (entry as { txid?: unknown })?.txid;
    if (typeof txid === 'string' && /^[a-zA-Z0-9]{26,35}$/.test(txid)) {
      txids.add(txid);
    }
  }
  return [...txids];
}
