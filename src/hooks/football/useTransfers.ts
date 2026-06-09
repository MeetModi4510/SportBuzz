import { useQuery } from '@tanstack/react-query';
import { transfersApi } from '../../services/football/transfersApi';

const NO_AUTO_REFETCH = {
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
};

export const useTransfers = () => {
  return useQuery({
    queryKey: ['football', 'latest-transfers'],
    queryFn: () => transfersApi.getLatestTransfers(),
    ...NO_AUTO_REFETCH,
    staleTime: 48 * 60 * 60 * 1000, // 48 hours
    gcTime: 48 * 60 * 60 * 1000,    // 48 hours
  });
};
