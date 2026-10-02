/**
 * @jest-environment node
 */
import { AssertPlatformAdminService } from '../assert-platform-admin.service';
import { ForbiddenError } from '@/shared/errors';
import type { IPlatformAdminRepository } from '@/core/platform/contracts';

function repoReturning(value: boolean | Error): IPlatformAdminRepository {
  return {
    isPlatformAdmin: jest.fn(async () =>
      value instanceof Error ? Promise.reject(value) : value
    ),
  };
}

describe('AssertPlatformAdminService', () => {
  it('resolves for a platform operator', async () => {
    const repo = repoReturning(true);
    await expect(new AssertPlatformAdminService(repo).execute('u1')).resolves.toBeUndefined();
    expect(repo.isPlatformAdmin).toHaveBeenCalledWith('u1');
  });

  it('throws ForbiddenError for an authenticated non-operator', async () => {
    const service = new AssertPlatformAdminService(repoReturning(false));
    await expect(service.execute('u1')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('maps to 403, not 401 — the caller is authenticated, just not an operator', async () => {
    const service = new AssertPlatformAdminService(repoReturning(false));
    await expect(service.execute('u1')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('propagates repository failures instead of falling open', async () => {
    const service = new AssertPlatformAdminService(repoReturning(new Error('db down')));
    await expect(service.execute('u1')).rejects.toThrow('db down');
  });
});
