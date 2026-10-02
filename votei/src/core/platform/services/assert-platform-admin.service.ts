import type { IPlatformAdminRepository } from '../contracts';
import { ForbiddenError } from '@/shared/errors';

/**
 * Gate for platform-operator-only work (cross-tenant reads, internal tooling).
 *
 * Throws rather than returning a boolean so a caller cannot forget to branch on
 * the result — the failure mode this whole layer exists to prevent is a gate
 * that is remembered per route instead of enforced structurally.
 */
export class AssertPlatformAdminService {
  constructor(private readonly admins: IPlatformAdminRepository) {}

  async execute(userId: string): Promise<void> {
    if (!(await this.admins.isPlatformAdmin(userId))) {
      throw new ForbiddenError('Platform operator access required.');
    }
  }
}
