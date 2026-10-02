'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiRequestError, fetchPreview, type SpecPayload } from '../lib/api';
import { blobToDataUrl } from '../lib/blob';

/**
 * Watermarked server render, kept in step with the chosen frame.
 *
 * No debounce: by the time this step is reachable the number and name are
 * already set, so the only input that changes here is a frame tap.
 */
export function usePreview(payload: SpecPayload | null) {
  const query = useQuery({
    queryKey: ['preview', payload],
    queryFn: async ({ signal }) => blobToDataUrl(await fetchPreview(payload!, signal)),
    enabled: Boolean(payload),
    staleTime: 5 * 60 * 1000,
    // Showing the previous frame while the next renders beats an empty box.
    placeholderData: (previous) => previous,
    retry: false,
  });

  return {
    url: query.data ?? null,
    loading: query.isFetching,
    error:
      query.error instanceof ApiRequestError
        ? query.error.message
        : query.error
          ? 'Não foi possível gerar a prévia.'
          : null,
  };
}
