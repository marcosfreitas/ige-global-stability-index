import { ConfigurationError } from '@/shared/errors';

export function assertEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new ConfigurationError(name);
  return value;
}
