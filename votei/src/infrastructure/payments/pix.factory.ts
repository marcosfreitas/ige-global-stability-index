import type { IPixProvider } from '@/core/orders/contracts';
import { EfiPixProvider } from './efi-pix.provider';
import { FakePixProvider, isFakePixEnabled } from './fake-pix.provider';

export function createPixProvider(): IPixProvider {
  return isFakePixEnabled() ? new FakePixProvider() : new EfiPixProvider();
}
