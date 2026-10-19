import { useQuery } from '@tanstack/react-query';
import { fetchLatestKpReading } from '../../services/kpService';

export const useKpIndexQuery = () => {
  return useQuery({
    queryKey: ['kpIndex'],
    queryFn: async ({ signal }) => {
      const data = await fetchLatestKpReading(signal);
      return data;
    },
    // Keep cached data for 6 hours as NOAA KP index updates are slow
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
  });
};
