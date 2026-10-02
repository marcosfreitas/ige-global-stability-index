import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RateLimitError } from '@/shared/errors';

let ratelimit: Ratelimit | null = null;

function isConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function getRatelimit(): Ratelimit {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
    });
  }
  return ratelimit;
}

/**
 * Throttle by a stable identifier (e.g. user id). No-ops when Upstash is not
 * configured so the starter runs locally without Redis; wire the env vars in
 * production to enforce limits. Throws RateLimitError when the limit is hit.
 */
export async function checkRateLimit(identifier: string): Promise<void> {
  if (!isConfigured()) return;
  const { success } = await getRatelimit().limit(identifier);
  if (!success) throw new RateLimitError();
}
