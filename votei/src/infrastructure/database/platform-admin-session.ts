import { createClient } from './server';
import { getCurrentUser } from './auth-session';
import { PlatformAdminRepository } from '@/infrastructure/repositories/platform-admin.repository';
import { AssertPlatformAdminService } from '@/core/platform/services/assert-platform-admin.service';

/**
 * One call that authenticates and authorizes a platform operator.
 *
 * Sits beside `getCurrentUser()` so a route handler gets the platform gate the
 * same way it gets the auth gate. Throws `UnauthorizedError` when there is no
 * session and `ForbiddenError` when the session is not an operator; both are
 * mapped to HTTP by `handleError()`.
 */
export async function requirePlatformAdmin() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const service = new AssertPlatformAdminService(new PlatformAdminRepository(supabase));
  await service.execute(user.id);
  return user;
}

/** Non-throwing variant, for pages that render a different view per role. */
export async function isCurrentUserPlatformAdmin(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return true;
  } catch {
    return false;
  }
}
