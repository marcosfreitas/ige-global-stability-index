import type { User } from '@supabase/supabase-js';
import { createClient } from './server';
import { AppError } from '@/shared/errors';

/**
 * The product has no sign-up: a visitor gets a Supabase anonymous session on
 * their first action and that cookie is the only key to their orders. Clearing
 * browser data is therefore irreversible — which is the intent.
 *
 * Only callable from a Route Handler or Server Action; it writes cookies.
 */
export async function getOrCreateAnonymousUser(): Promise<User> {
  const supabase = await createClient();

  const { data: existing } = await supabase.auth.getUser();
  if (existing.user) return existing.user;

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    console.error('[anonymous-session] signInAnonymously failed:', error?.message);
    throw new AppError(
      'SESSION_FAILED',
      'Não foi possível iniciar a sessão. Verifique se o login anônimo está habilitado no Supabase.',
      503
    );
  }

  return data.user;
}
