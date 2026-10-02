import type { NextRequest } from 'next/server';

/**
 * Best-effort client address for rate limiting anonymous traffic. Only
 * meaningful behind a proxy that sets these headers (Vercel does).
 */
export function getRequestIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}
