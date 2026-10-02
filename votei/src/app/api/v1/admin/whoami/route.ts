import { ok, handleError } from '@/shared/utils/api-handler';
import { requirePlatformAdmin } from '@/infrastructure/database/platform-admin-session';
import { checkRateLimit } from '@/shared/utils/rate-limit';

/**
 * Worked example of the platform-operator gate. Returns 401 with no session,
 * 403 for an authenticated non-operator, 200 for an operator.
 *
 * A real cross-tenant endpoint adds its own table plus a
 * `using ((select public.is_admin()))` policy, and reads it on the same
 * session-scoped client this gate already used.
 */
export async function GET() {
  try {
    const operator = await requirePlatformAdmin();
    await checkRateLimit(`admin-whoami:${operator.id}`);
    return ok({ userId: operator.id, email: operator.email, platformAdmin: true });
  } catch (err) {
    return handleError(err);
  }
}
