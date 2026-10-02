'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createOrder,
  fetchOrderStatus,
  type CreatedOrder,
  type SpecPayload,
} from '../lib/api';

const POLL_INTERVAL_MS = 3_000;

export function useCreateOrder(onCreated: (order: CreatedOrder) => void) {
  return useMutation({
    mutationFn: (payload: SpecPayload) => createOrder(payload),
    onSuccess: onCreated,
  });
}

/**
 * Polls while the charge is open. `refetchOnWindowFocus` is deliberately on:
 * paying by Pix means switching to a banking app, so the moment the buyer
 * comes back is exactly when the status is worth re-checking.
 */
export function useOrderStatus(orderId: string | null) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderStatus(orderId!),
    enabled: Boolean(orderId),
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'paid' || status === 'delivered' || status === 'expired') return false;
      return POLL_INTERVAL_MS;
    },
  });
}
