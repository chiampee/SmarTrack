import { useState } from 'react'
import { Link } from '../types/Link'
import { useToast } from '../components/Toast'
import { mutate } from 'swr'
import { STATS_KEY } from './useUserStats'

interface UseBulkOperationsOptions {
  links: Link[]
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>
  selectedLinks: Set<string>
  clearSelection: () => void
  makeRequest: <T>(endpoint: string, options?: RequestInit) => Promise<T>
}

/**
 * Custom hook for bulk operations on links
 * Provides reusable logic for archive, favorite, and delete operations
 */
export const useBulkOperations = ({
  links,
  setLinks,
  selectedLinks,
  clearSelection,
  makeRequest
}: UseBulkOperationsOptions) => {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  /**
   * Generic bulk update function
   * Handles optimistic updates and error recovery
   */
  const bulkUpdate = async <T extends Partial<Link>>(
    updates: T,
    operationName: string,
    successMessage: string,
    errorMessage: string
  ): Promise<void> => {
    if (selectedLinks.size === 0) return

    const linkIds = Array.from(selectedLinks)
    const previousLinks = [...links]

    // Optimistic update
    setLinks(prevLinks =>
      prevLinks.map(link =>
        selectedLinks.has(link.id) ? { ...link, ...updates } : link
      )
    )

    clearSelection()

    try {
      setLoading(true)

      const results = await Promise.allSettled(
        linkIds.map(linkId =>
          makeRequest(`/api/links/${linkId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
          })
        )
      )

      const failed = results.filter(r => r.status === 'rejected').length

      if (failed > 0) {
        // Revert on partial failure
        setLinks(previousLinks)
        toast.error(`${failed} of ${linkIds.length} link(s) failed to ${operationName}`)
      } else {
        // Invalidate stats cache to trigger refresh
        // Use global mutate function - this will trigger revalidation for all components using this key
        mutate(STATS_KEY, undefined, { revalidate: true }).catch((error: any) => {
          console.error('[SWR] Failed to invalidate stats cache:', error)
        })
        console.log('[SWR] Stats cache invalidation triggered after bulk operation')
        
        const message = successMessage.replace('{count}', linkIds.length.toString())
        toast.success(message)
      }
    } catch (error) {
      // Revert on complete failure
      setLinks(previousLinks)
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const bulkArchive = () =>
    bulkUpdate(
      { isArchived: true },
      'archive',
      '{count} link(s) archived successfully',
      'Failed to archive links. Please try again.'
    )

  const bulkFavorite = () =>
    bulkUpdate(
      { isFavorite: true },
      'favorite',
      '{count} link(s) favorited successfully',
      'Failed to favorite links. Please try again.'
    )

  const bulkDelete = async (): Promise<void> => {
    if (selectedLinks.size === 0) return

    const linkIds = Array.from(selectedLinks)
    const previousLinks = [...links]

    // Optimistic delete
    setLinks(prevLinks => prevLinks.filter(link => !selectedLinks.has(link.id)))
    clearSelection()

    try {
      setLoading(true)

      const results = await Promise.allSettled(
        linkIds.map(linkId =>
          makeRequest(`/api/links/${linkId}`, { method: 'DELETE' })
        )
      )

      const failed = results.filter(r => r.status === 'rejected').length

      if (failed > 0) {
        setLinks(previousLinks)
        toast.error(`${failed} of ${linkIds.length} link(s) failed to delete`)
      } else {
        // Invalidate stats cache to trigger refresh
        // Use global mutate function - this will trigger revalidation for all components using this key
        mutate(STATS_KEY, undefined, { revalidate: true }).catch((error: any) => {
          console.error('[SWR] Failed to invalidate stats cache:', error)
        })
        console.log('[SWR] Stats cache invalidation triggered after bulk operation')
        
        toast.success(`${linkIds.length} link(s) deleted successfully`)
      }
    } catch (error) {
      setLinks(previousLinks)
      toast.error('Failed to delete links. Please try again.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    bulkArchive,
    bulkFavorite,
    bulkDelete,
  }
}

