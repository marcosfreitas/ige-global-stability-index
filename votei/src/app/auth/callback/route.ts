import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/database/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  // Only allow same-origin relative paths — reject protocol-relative (`//evil`)
  // or backslash-tricks to prevent open redirects.
  const nextParam = searchParams.get('next') ?? '/dashboard';
  const next =
    nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.startsWith('/\\')
      ? nextParam
      : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_failed`);
}
