import { useQuery } from '@tanstack/react-query';
import { searchPlaces, getTrendingPlaces, getPlace } from '../services/api';
import { SearchParams } from '../types';

export function usePlaceSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['places', 'search', params],
    queryFn: () => searchPlaces(params),
    enabled: Object.values(params).some(Boolean),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTrendingPlaces() {
  return useQuery({
    queryKey: ['places', 'trending'],
    queryFn: getTrendingPlaces,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlaceDetail(id: string) {
  return useQuery({
    queryKey: ['places', id],
    queryFn: () => getPlace(id),
    enabled: !!id,
  });
}
