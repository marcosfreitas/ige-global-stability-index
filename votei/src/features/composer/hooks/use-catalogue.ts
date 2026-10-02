'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCatalogue } from '../lib/api';

export function useCatalogue() {
  return useQuery({
    queryKey: ['catalogue'],
    queryFn: () => fetchCatalogue(),
    staleTime: Infinity,
  });
}
