import useSWR from 'swr'
import { statsFetcher } from '../utils/swrFetcher'
import { UserStats } from './useBackendApi'
import { useBackendApi } from './useBackendApi'

const STATS_KEY = '/api/users/stats'

/**
 * Custom hook for fetching user stats with SWR
 * Provides automatic cache invalidation and real-time updates
 * 
 * OPTIMIZATION: Conditional fetching - only fetches when authenticated
 * OPTIMIZATION: Uses keepPreviousData to prevent loading flicker during revalidation
 */
export const useUserStats = () => {
  const { isAuthenticated } = useBackendApi()
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<UserStats>(
    // CONDITIONAL: Only fetch when authenticated (null = don't fetch)
    isAuthenticated ? STATS_KEY : null,
    statsFetcher,
    {
      // OPTIMIZATION: Show previous data while revalidating (prevents loading flicker)
      keepPreviousData: true,
      // OPTIMIZATION: Don't revalidate if data is fresh (mutate handles updates)
      revalidateIfStale: false,
      // OPTIMIZATION: Stats change infrequently, disable focus revalidation
      // Mutate calls handle updates, focus revalidation is unnecessary
      revalidateOnFocus: false,
      // Keep reconnect revalidation for network recovery
      revalidateOnReconnect: true,
    }
  )

  return {
    stats: data,
    loading: isLoading,
    isValidating, // Expose for showing subtle revalidation indicator
    error,
    mutate,
  }
}

/**
 * Export the stats key for use in mutate calls
 */
export { STATS_KEY }
