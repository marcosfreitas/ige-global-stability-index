import { createClient } from './server';
import { UnauthorizedError } from '@/shared/errors';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new UnauthorizedError();
  return user;
}

export async function getCurrentUserOrNull() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
