import { CARGOS } from '@/core/compose/entities/composition';
import { FRAMES } from '@/core/compose/entities/frame';
import { getPriceBrlCents } from '@/config/pricing';
import { ok, handleError } from '@/shared/utils/api-handler';

export const runtime = 'nodejs';

/** Static catalogue plus the live price, so the UI never hardcodes either. */
export async function GET() {
  try {
    return ok({ frames: FRAMES, cargos: CARGOS, priceCents: getPriceBrlCents() });
  } catch (err) {
    return handleError(err);
  }
}
