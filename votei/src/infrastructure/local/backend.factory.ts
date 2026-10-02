import type { IOrderRepository, IPhotoStore } from '@/core/orders/contracts';
import { createAdminClient } from '@/infrastructure/database/admin';
import { OrderRepository } from '@/infrastructure/repositories/order.repository';
import { SupabasePhotoStore } from '@/infrastructure/storage/supabase-photo.store';
import { FileSystemPhotoStore } from './fs-photo.store';
import { JsonFileOrderRepository } from './json-order.repository';
import { isLocalBackendEnabled } from './local-backend';

export function createPhotoStore(): IPhotoStore {
  return isLocalBackendEnabled()
    ? new FileSystemPhotoStore()
    : new SupabasePhotoStore(createAdminClient());
}

export function createOrderRepository(): IOrderRepository {
  return isLocalBackendEnabled()
    ? new JsonFileOrderRepository()
    : new OrderRepository(createAdminClient());
}
