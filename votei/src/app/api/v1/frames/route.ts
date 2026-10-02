import { CARGOS } from '@/core/compose/entities/composition';
import { FRAMES } from '@/core/compose/entities/frame';
import { STYLES } from '@/core/compose/entities/style';
import { isStylingAvailable } from '@/infrastructure/imaging/stylizer.factory';
import { getPriceBrlCents } from '@/config/pricing';
import { ok, handleError } from '@/shared/utils/api-handler';

export const runtime = 'nodejs';

/** Static catalogue plus the live price, so the UI never hardcodes either. */
export async function GET() {
  try {
    // The model prompt is server-side detail; the client only needs id + label.
    // With no provider configured the list goes out empty, so the UI hides a
    // control that could not do anything.
    const styles = isStylingAvailable() ? STYLES.map(({ id, label }) => ({ id, label })) : [];
    return ok({ frames: FRAMES, cargos: CARGOS, styles, priceCents: getPriceBrlCents() });
  } catch (err) {
    return handleError(err);
  }
}
