import { CARGOS } from '@/core/compose/entities/composition';
import { FRAMES } from '@/core/compose/entities/frame';
import { STYLES } from '@/core/compose/entities/style';
import { getPriceBrlCents } from '@/config/pricing';
import { ok, handleError } from '@/shared/utils/api-handler';

export const runtime = 'nodejs';

/** Static catalogue plus the live price, so the UI never hardcodes either. */
export async function GET() {
  try {
    // The model prompt is server-side detail; the client only needs id + label.
    const styles = STYLES.map(({ id, label }) => ({ id, label }));
    return ok({ frames: FRAMES, cargos: CARGOS, styles, priceCents: getPriceBrlCents() });
  } catch (err) {
    return handleError(err);
  }
}
