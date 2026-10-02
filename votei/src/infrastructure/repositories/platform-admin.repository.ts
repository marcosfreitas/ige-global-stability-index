import type { IPlatformAdminRepository } from '@/core/platform/contracts';
import { BaseRepository } from './base.repository';

/**
 * Reads membership through the SESSION-scoped Supabase client, never the
 * service-role one. Service-role bypasses RLS, so pairing it with a policy
 * leaves the application check as the only authorization and the policy never
 * runs — the database stops participating in the decision.
 *
 * The row-level read below is allowed by the `platform_admins_read_own` policy
 * (a user may see their own row and no other). It does not go through
 * `public.is_admin()`: that function's job is to be called from OTHER tables'
 * policies, where the caller cannot read platform_admins at all.
 */
export class PlatformAdminRepository
  extends BaseRepository
  implements IPlatformAdminRepository
{
  async isPlatformAdmin(userId: string): Promise<boolean> {
    const { data, error } = await this.db
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) this.handleError(error, 'isPlatformAdmin');
    return data !== null;
  }
}
