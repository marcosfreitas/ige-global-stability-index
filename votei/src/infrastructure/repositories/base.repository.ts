import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database/types';
import { DatabaseError } from '@/shared/errors';

export abstract class BaseRepository {
  constructor(protected readonly db: SupabaseClient<Database>) {}

  protected handleError(err: unknown, context: string): never {
    console.error(`[Repository:${context}]`, err);
    throw new DatabaseError(context, err);
  }
}
