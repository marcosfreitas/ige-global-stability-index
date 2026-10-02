'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiRequestError, downloadFinalImage } from '../lib/api';
import { blobToDataUrl } from '../lib/blob';

/** The paid render. Cached so a re-share does not re-hit the renderer. */
export function useFinalImage(orderId: string | null) {
  const query = useQuery({
    queryKey: ['final-image', orderId],
    queryFn: async () => {
      const blob = await downloadFinalImage(orderId!);
      return { blob, dataUrl: await blobToDataUrl(blob) };
    },
    enabled: Boolean(orderId),
    staleTime: Infinity,
    retry: 1,
  });

  return {
    blob: query.data?.blob ?? null,
    url: query.data?.dataUrl ?? null,
    loading: query.isPending,
    error:
      query.error instanceof ApiRequestError
        ? query.error.message
        : query.error
          ? 'Não foi possível carregar a imagem.'
          : null,
  };
}
