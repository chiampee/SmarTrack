import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Grid, List, Download, Archive, Chrome, Tag, MessageSquare, Globe, File, Trash2, Star } from 'lucide-react'
import { LinkedInLogo, XLogo, RedditLogo, WebIcon, PDFIcon, YouTubeLogo } from '../components/BrandLogos'
import { useMobileOptimizations } from '../hooks/useMobileOptimizations'
import { useExtensionDetection } from '../hooks/useExtensionDetection'
import { LinkCard } from '../components/LinkCard'
import { SearchAutocomplete } from '../components/SearchAutocomplete'
import { AddLinkModal } from '../components/AddLinkModal'
import { EditLinkModal } from '../components/EditLinkModal'
import { CreateCollectionModal } from '../components/CreateCollectionModal'
import { ExtensionInstallModal } from '../components/ExtensionInstallModal'
import { FiltersDropdown } from '../components/FiltersDropdown'
import { useBackendApi } from '../hooks/useBackendApi'
import { useBulkOperations } from '../hooks/useBulkOperations'
import { useToast } from '../components/Toast'
import { useCategories } from '../context/CategoriesContext'
import { Link, Collection, Category } from '../types/Link'
import { logger } from '../utils/logger'
import { cacheManager } from '../utils/cacheManager'
import { DashboardSkeleton } from '../components/LoadingSkeleton'

export const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [links, setLinks] = useState<Link[]>([])
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(false)
  const [slowLoading, setSlowLoading] = useState(false)
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false)
  const [showExtensionInstallModal, setShowExtensionInstallModal] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    category: '',
    dateRange: 'all_time' as 'today' | 'last_week' | 'last_month' | 'last_year' | 'all_time',
    tags: [] as string[],
    contentType: '' as Link['contentType'] | ''
  })
  const backendApi = useBackendApi()
  const { getLinks, isAuthenticated, makeRequest } = backendApi
  const toast = useToast()
  const { computeCategories, setCategories } = useCategories()
  const [collections, setCollections] = useState<Collection[]>([])
  const [categories, setCategoriesState] = useState<Category[]>([])
  const location = useLocation()
  const navigate = useNavigate()
  const [currentCategoryName, setCurrentCategoryName] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const { isMobile, prefersReducedMotion, animationConfig } = useMobileOptimizations()
  const isExtensionInstalled = useExtensionDetection()

  // Show extension install modal for first-time users (desktop only)
  useEffect(() => {
    if (!isExtensionInstalled && isAuthenticated && !isMobile) {
      // Check if user has dismissed the modal
      const dismissed = localStorage.getItem('smartrack-extension-install-dismissed')
      if (!dismissed) {
        // Show modal after a short delay to let detection complete
        const timer = setTimeout(() => {
          setShowExtensionInstallModal(true)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [isExtensionInstalled, isAuthenticated, isMobile])

  // Check if we should redirect to analytics after login
  useEffect(() => {
    const redirectTo = searchParams.get('redirect')
    if (redirectTo === 'analytics' && isAuthenticated) {
      // Check if user is admin and navigate to analytics
      // This will be handled by useAdminAccess, but we can help navigate
      const timer = setTimeout(() => {
        navigate('/analytics')
      }, 1000) // Small delay to ensure auth state is ready
      return () => clearTimeout(timer)
    }
  }, [searchParams, isAuthenticated, navigate])

  // Debug: Test token on load to help diagnose admin access issues
  // Removed for production cleanup
  /*
  useEffect(() => {
    if (isAuthenticated) {
      // Auto-test token to help debug admin access
      const testToken = async () => {
        try {
          const debugInfo = await makeRequest<any>('/api/debug-token')
          console.log('🔍 [DEBUG] Token Debug Info:', JSON.stringify(debugInfo, null, 2))
          console.log('🔍 [DEBUG] Email found:', debugInfo.tokenInfo?.emailFromToken || debugInfo.tokenInfo?.email || 'NOT FOUND')
          console.log('🔍 [DEBUG] Admin check:', debugInfo.adminCheck)
        } catch (error) {
          console.error('🔍 [DEBUG] Token debug failed:', error)
        }
      }
      // Only run once after a delay
      const timer = setTimeout(testToken, 2000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, makeRequest])
  */

  // Load links from backend
  useEffect(() => {
    const fetchLinks = async () => {
      // Don't fetch if not authenticated yet
      if (!isAuthenticated) {
        return
      }

      try {
        // Track performance
        const startTime = Date.now()
        
        // Try to load from cache first for instant display
        const userId = backendApi.getUserId()
        if (userId) {
          const cachedLinks = await cacheManager.getLinks(userId)
          if (cachedLinks && cachedLinks.length > 0) {
            console.log(`[Perf] Loaded ${cachedLinks.length} links from cache in ${Date.now() - startTime}ms`)
            setLinks(cachedLinks)
            setFilteredLinks(cachedLinks)
            const computedCategories = computeCategories(cachedLinks)
            setCategories(computedCategories)
            // Don't return - still fetch fresh data in background
          }
        }
        
        setLoading(true)
        setSlowLoading(false)
        const slowTimer = setTimeout(() => {
          setSlowLoading(true)
          console.warn('[Perf] Slow loading detected (>6s) - backend may be cold starting')
        }, 6000)
        
        const data = await getLinks()
        clearTimeout(slowTimer)
        
        const loadTime = Date.now() - startTime
        console.log(`[Perf] Loaded ${data?.length || 0} links from backend in ${loadTime}ms`)
        
        setLinks(data || [])
        setFilteredLinks(data || [])
        
        // Update cache for next visit
        if (userId && data) {
          await cacheManager.saveLinks(userId, data)
          console.log('[Perf] Updated cache with fresh data')
        }
        
        // Update categories with link counts
        const computedCategories = computeCategories(data || [])
        setCategories(computedCategories)
      } catch (error) {
        logger.error('Failed to fetch links', { component: 'Dashboard', action: 'fetchLinks' }, error as Error)
        // Silently fail - already handled in getLinks
      } finally {
        setLoading(false)
        setSlowLoading(false)
      }
    }
    
    fetchLinks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // Handle createCollection query parameter separately to ensure modal opens
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const createCollection = params.get('createCollection')
    
    if (createCollection === '1') {
      setShowCreateCollectionModal(true)
    } else if (showCreateCollectionModal && !createCollection) {
      // Close modal if param is removed from URL
      setShowCreateCollectionModal(false)
    }
  }, [location.search, showCreateCollectionModal])

  // React to sidebar query params: filter, collection, category
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const filter = params.get('filter')
    const collection = params.get('collection')
    const categoryParam = params.get('category')

    // Persist current view for future visits
    try {
      localStorage.setItem('dashboard:lastView', location.search || '?')
    } catch (_) { void 0 }

    if (!filter && !collection && !categoryParam) {
      setSelectedCollectionId(null)
      setActiveFilterId(null)
      setCurrentCategoryName(null)
      // Exclude archived links from default view
      setFilteredLinks(links.filter(l => !l.isArchived))
      return
    }

    if (collection) {
      setSelectedCollectionId(collection)
      setActiveFilterId(null)
      setCurrentCategoryName(null)
      // Exclude archived links from collection view
      setFilteredLinks(links.filter(l => l.collectionId === collection && !l.isArchived))
      return
    }

    switch (filter) {
      case 'favorites': {
        setSelectedCollectionId(null)
        setActiveFilterId('favorites')
        setCurrentCategoryName(null)
        // Exclude archived links from favorites view
        setFilteredLinks(links.filter(l => l.isFavorite && !l.isArchived))
        break
      }
      case 'recent': {
        setSelectedCollectionId(null)
        setActiveFilterId('recent')
        setCurrentCategoryName(null)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentLinks = links
          .filter(l => new Date(l.createdAt) >= sevenDaysAgo && !l.isArchived)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setFilteredLinks(recentLinks)
        break
      }
      case 'archived': {
        setSelectedCollectionId(null)
        setActiveFilterId('archived')
        setCurrentCategoryName(null)
        setFilteredLinks(links.filter(l => l.isArchived))
        break
      }
      default: {
        if (categoryParam) {
          setSelectedCollectionId(null)
          setActiveFilterId(null)
          const catLower = categoryParam.toLowerCase()
          // Exclude archived links from category view (unless already archived)
          setFilteredLinks(links.filter(l => 
            (l.category || '').toLowerCase() === catLower && !l.isArchived
          ))
        } else {
          setSelectedCollectionId(null)
          setActiveFilterId(null)
          // Exclude archived links from default view
          setFilteredLinks(links.filter(l => !l.isArchived))
        }
      }
    }
  }, [location.search, links])

  // Restore last view if user opens dashboard without params
  useEffect(() => {
    if (!location.search) {
      try {
        const last = localStorage.getItem('dashboard:lastView')
        if (last) {
          navigate({ pathname: '/', search: last }, { replace: true })
        }
      } catch (_) { void 0 }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts for power users
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }
      // Focus search
      if (e.key === '/') {
        e.preventDefault()
        const input = document.querySelector('input[placeholder="Search your research library..."]') as HTMLInputElement | null
        input?.focus()
        return
      }
      // Quick filters
      if (e.key.toLowerCase() === 'g') navigate('/?')
      if (e.key.toLowerCase() === 'f') navigate('/?filter=favorites')
      if (e.key.toLowerCase() === 'r') navigate('/?filter=recent')
      if (e.key.toLowerCase() === 'a') navigate('/?filter=archived')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  // Debounced collection refetch to prevent multiple simultaneous requests
  const refetchCollectionsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRefetchingCollectionsRef = useRef(false)
  
  const refetchCollections = useCallback(() => {
    // Clear any pending refetch
    if (refetchCollectionsTimeoutRef.current) {
      clearTimeout(refetchCollectionsTimeoutRef.current)
    }
    
    // Schedule a new refetch after 800ms (longer debounce to prevent concurrent requests)
    refetchCollectionsTimeoutRef.current = setTimeout(async () => {
      // Prevent concurrent refetches
      if (isRefetchingCollectionsRef.current) {
        console.log('[Collections] Skipping refetch - already in progress')
        return
      }
      
      try {
        isRefetchingCollectionsRef.current = true
        console.log('[Collections] Refetching collections...')
        
        const userId = backendApi.getUserId()
        const cachedCollections = userId ? await cacheManager.getCollections(userId) : null
        
        const cols = await makeRequest<Collection[]>('/api/collections').catch(async (error) => {
          // If rate limited, use cached data if available
          if (error?.status === 429 && cachedCollections) {
            console.warn('[Collections] Rate limited during refetch, using cached data')
            return cachedCollections
          }
          throw error
        })
        
        setCollections(cols || [])
        console.log('[Collections] Successfully refetched:', cols?.length || 0, 'collections')
        
        // Update cache with fresh data
        if (userId && cols) {
          await cacheManager.saveCollections(userId, cols)
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e))
        // Only log if not a timeout or rate limit (we handle those gracefully)
        if (!error.message.includes('timeout') && !error.message.includes('429') && !error.message.includes('Too many requests')) {
          logger.error('Failed to refetch collections', { component: 'Dashboard', action: 'refetchCollections' }, error)
        }
      } finally {
        isRefetchingCollectionsRef.current = false
      }
    }, 800)
  }, [makeRequest])

  // Load collections and categories from backend with caching
  // ✅ Use ref to prevent concurrent fetches
  const fetchingMetaRef = useRef(false)
  
  useEffect(() => {
    const fetchMeta = async () => {
      if (!isAuthenticated) return
      if (fetchingMetaRef.current) {
        console.log('[Dashboard] Metadata fetch already in progress, skipping')
        return
      }
      
      const userId = backendApi.getUserId()
      if (!userId) return
      
      fetchingMetaRef.current = true
      
      try {
        // Try to load collections from cache first
        const cachedCollections = await cacheManager.getCollections(userId)
        if (cachedCollections && cachedCollections.length >= 0) {
          setCollections(cachedCollections)
        }
        
        // ✅ Sequential fetch instead of parallel to reduce concurrent requests
        // Fetch categories first (lighter request)
        let cats: Category[] = []
        try {
          cats = await makeRequest<Category[]>('/api/categories')
          setCategoriesState(cats || [])
        } catch (error) {
          console.warn('[Dashboard] Failed to fetch categories, using empty array')
          setCategoriesState([])
        }
        
        // Then fetch collections (with fallback to cache)
        try {
          const cols = await makeRequest<Collection[]>('/api/collections')
          setCollections(cols || [])
          
          // Update cache with fresh collections data
          if (userId && cols) {
            await cacheManager.saveCollections(userId, cols)
          }
        } catch (error: any) {
          // If rate limited or network error, use cached data if available
          if ((error?.status === 429 || error?.type === 'NETWORK_ERROR') && cachedCollections) {
            console.warn('[Collections] Request failed, using cached data')
            setCollections(cachedCollections)
          } else {
            // Only log if not a network/rate limit error
            const errorMsg = error instanceof Error ? error.message : String(error)
            if (!errorMsg.includes('429') && !errorMsg.includes('Too many requests') && !errorMsg.includes('Network error')) {
              logger.error('Failed to load collections', { component: 'Dashboard', action: 'fetchMetadata' }, error)
            }
          }
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e))
        // Only log if not rate limit or network error (we handle those gracefully)
        const errorMsg = error.message || String(e)
        if (!errorMsg.includes('429') && !errorMsg.includes('Too many requests') && !errorMsg.includes('Network error')) {
          logger.error('Failed to load metadata', { component: 'Dashboard', action: 'fetchMetadata' }, error)
        }
      } finally {
        fetchingMetaRef.current = false
      }
    }
    fetchMeta()
  }, [isAuthenticated, makeRequest, backendApi])

  // Filter links based on search and filters
  useEffect(() => {
    console.log('🔍 useEffect: Recalculating filteredLinks from links array', {
      selectedCollectionId,
      activeFilterId,
      searchQuery,
      totalLinks: links.length,
      timestamp: new Date().toISOString()
    })
    console.log('🔍 Current links order:', links.slice(0, 3).map(l => l.title))
    
    let filtered = links

    // Collection filter (takes precedence)
    if (selectedCollectionId) {
      filtered = filtered.filter(link => link.collectionId === selectedCollectionId && !link.isArchived)
      setFilteredLinks(filtered)
      return
    }

    // Special filters
    if (activeFilterId) {
      switch (activeFilterId) {
        case 'favorites':
          filtered = filtered.filter(link => link.isFavorite && !link.isArchived)
          break
        case 'recent': {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          filtered = filtered
            .filter(link => new Date(link.createdAt) >= sevenDaysAgo && !link.isArchived)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        }
        case 'archived':
          filtered = filtered.filter(link => link.isArchived)
          break
        default:
          // Exclude archived links from default view
          filtered = filtered.filter(link => !link.isArchived)
      }
      
      // Apply search even with special filters
      if (searchQuery && activeFilterId !== 'recent') {
        filtered = filtered.filter(link => 
          link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          link.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      }
      
      setFilteredLinks(filtered)
      return
    }

    // Default view: exclude archived
    filtered = filtered.filter(link => !link.isArchived)

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(link => 
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(link => link.category === filters.category)
    }

    // Date filter
    if (filters.dateRange !== 'all_time') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0)
          break
        case 'last_week':
          cutoff.setDate(now.getDate() - 7)
          break
        case 'last_month':
          cutoff.setMonth(now.getMonth() - 1)
          break
        case 'last_year':
          cutoff.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(link => new Date(link.createdAt) >= cutoff)
    }

    // Content type filter
    if (filters.contentType) {
      filtered = filtered.filter(link => link.contentType === filters.contentType)
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(link => 
        filters.tags.every(tag => link.tags.includes(tag))
      )
    }

    setFilteredLinks(filtered)
  }, [links, searchQuery, filters, selectedCollectionId, activeFilterId])

  // Handle link actions
  const handleLinkAction = async (linkId: string, action: string, data?: any) => {
    switch (action) {
      case 'update': {
        const linkToEdit = links.find(l => l.id === linkId)
        if (linkToEdit) {
          setEditingLink(linkToEdit)
        }
        break
      }
      case 'delete':
        try {
          const linkToDelete = links.find(l => l.id === linkId)
          await makeRequest(`/api/links/${linkId}`, {
            method: 'DELETE',
          })
          setLinks(links.filter(l => l.id !== linkId))
          
          // If deleted link was in a collection, refresh collections to update counts
          if (linkToDelete?.collectionId) {
            refetchCollections()
          }
          
          toast.success('Link deleted')
        } catch (error) {
          logger.error('Failed to delete link', { component: 'Dashboard', action: 'deleteLink', metadata: { linkId } }, error as Error)
          toast.error('Failed to delete link. Please try again.')
        }
        break
      case 'toggleFavorite':
        try {
          const link = links.find(l => l.id === linkId)
          if (link) {
            await makeRequest(`/api/links/${linkId}`, {
              method: 'PUT',
              body: JSON.stringify({
                isFavorite: !link.isFavorite,
              }),
            })
            setLinks(links.map(l => 
              l.id === linkId ? { ...l, isFavorite: !l.isFavorite } : l
            ))
            toast.success('Favorite updated')
          }
        } catch (error) {
          logger.error('Failed to toggle favorite', { component: 'Dashboard', action: 'toggleFavorite', metadata: { linkId } }, error as Error)
          toast.error('Failed to update favorite. Please try again.')
        }
        break
      case 'toggleArchive':
        try {
          const link = links.find(l => l.id === linkId)
          if (link) {
            await makeRequest(`/api/links/${linkId}`, {
              method: 'PUT',
              body: JSON.stringify({
                isArchived: !link.isArchived,
              }),
            })
            setLinks(links.map(l => 
              l.id === linkId ? { ...l, isArchived: !l.isArchived } : l
            ))
            toast.success('Archive status updated')
          }
        } catch (error) {
          logger.error('Failed to toggle archive', { component: 'Dashboard', action: 'toggleArchive', metadata: { linkId } }, error as Error)
          toast.error('Failed to update archive status. Please try again.')
        }
        break
      case 'moveToProject':
        // ✅ Handle moving link to a different project/collection
        try {
          const link = links.find(l => l.id === linkId)
          if (!link) break
          
          const newCollectionId = data?.collectionId || null
          const oldCollectionId = link.collectionId
          
          await makeRequest(`/api/links/${linkId}`, {
            method: 'PUT',
            body: JSON.stringify({
              collectionId: newCollectionId,
            }),
          })
          
          // Update local state
          setLinks(links.map(l => 
            l.id === linkId ? { ...l, collectionId: newCollectionId } : l
          ))
          
          // Refresh collections to update counts if collection changed
          if (oldCollectionId !== newCollectionId) {
            refetchCollections()
          }
          
          if (newCollectionId) {
            const collection = collections.find(c => c.id === newCollectionId)
            toast.success(`Moved to "${collection?.name || 'project'}"`)
          } else {
            toast.success('Removed from project')
          }
        } catch (error) {
          logger.error('Failed to move link', { component: 'Dashboard', action: 'moveToProject', metadata: { linkId } }, error as Error)
          toast.error('Failed to move link. Please try again.')
        }
        break
      case 'quickEdit':
        // Quick inline edit from accordion
        try {
          const link = links.find(l => l.id === linkId)
          if (!link) break
          
          const oldCollectionId = link.collectionId
          const newCollectionId = data?.collectionId
          
          const response = await makeRequest<Link>(`/api/links/${linkId}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: data.title,
              description: data.description,
              category: data.category,
              tags: data.tags,
              collectionId: newCollectionId === null ? null : (newCollectionId || null),
            }),
          })
          
          // Update local state
          setLinks(links.map(l => 
            l.id === linkId ? { ...l, ...response, updatedAt: new Date(response.updatedAt) } : l
          ))
          
          // Refresh collections if collection changed
          const normalizedOld = oldCollectionId || null
          const normalizedNew = response.collectionId || null
          if (normalizedOld !== normalizedNew) {
            refetchCollections()
          }
          
          toast.success('Link updated!')
        } catch (error) {
          logger.error('Failed to quick edit link', { component: 'Dashboard', action: 'quickEdit', metadata: { linkId } }, error as Error)
          toast.error('Failed to save changes. Please try again.')
        }
        break
    }
  }

  // ✅ ENHANCED: Handle edit link save with proper data consistency
  const handleEditLink = async (linkId: string, updates: Partial<Link>) => {
    try {
      // ✅ FIX: Get the original link to detect collectionId changes
      const originalLink = links.find(l => l.id === linkId)
      
      // ✅ FIX: Always include collectionId in the request
      // Use null to explicitly remove from collection (not undefined which would skip the field)
      const response = await makeRequest<Link>(`/api/links/${linkId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          category: updates.category,
          tags: updates.tags,
          contentType: updates.contentType,
          isFavorite: updates.isFavorite,
          isArchived: updates.isArchived,
          // Always send collectionId - null means remove from collection
          collectionId: updates.collectionId === null ? null : (updates.collectionId || null),
        }),
      })
      
      // ✅ Update links array - useEffect will automatically recalculate filteredLinks
      setLinks(links.map(l =>
        l.id === linkId ? { ...l, ...response, updatedAt: new Date(response.updatedAt) } : l
      ))

      // ✅ FIX: Refetch collections if either old or new collection is involved
      // This ensures counts are updated correctly in all scenarios:
      // - Moving from one collection to another
      // - Removing from a collection
      // - Adding to a collection
      // Normalize undefined and null to be equivalent for comparison
      const oldCollectionId = originalLink?.collectionId || null
      const newCollectionId = response.collectionId || null
      const collectionChanged = oldCollectionId !== newCollectionId
      if (collectionChanged) {
        refetchCollections()
      }

      // Close the edit modal
      setEditingLink(null)

      toast.success('Link updated successfully!')
    } catch (error) {
      logger.error('Failed to update link', { component: 'Dashboard', action: 'updateLink', metadata: { linkId } }, error as Error)
      toast.error('Failed to update link. Please try again.')
    }
  }

  // Toggle link selection
  const toggleSelection = (linkId: string) => {
    setSelectedLinks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(linkId)) {
        newSet.delete(linkId)
      } else {
        newSet.add(linkId)
      }
      return newSet
    })
  }

  // Select all links
  const selectAll = () => {
    setSelectedLinks(new Set(filteredLinks.map(l => l.id)))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedLinks(new Set())
  }

  // Use bulk operations hook (must be after clearSelection is defined)
  const {
    loading: bulkLoading,
    bulkArchive: handleBulkArchive,
    bulkFavorite: handleBulkFavorite,
    bulkDelete: handleBulkDelete,
  } = useBulkOperations({
    links,
    setLinks,
    selectedLinks,
    clearSelection,
    makeRequest,
  })

  // Use bulk loading state
  const isLoading = loading || bulkLoading

  // Handle collection/category selection from sidebar
  const handleCollectionSelect = (id: string) => {
    // Show all links
    if (id === 'all') {
      setSelectedCollectionId(null)
      setActiveFilterId(null)
      // Exclude archived links from default view
      setFilteredLinks(links.filter(l => !l.isArchived))
      return
    }
    
    // Quick filters
    if (id === 'favorites') {
      setSelectedCollectionId(null)
      setActiveFilterId('favorites')
      // Exclude archived links from favorites view
      const favoriteLinks = links.filter(l => l.isFavorite && !l.isArchived)
      setFilteredLinks(favoriteLinks)
      return
    }
    if (id === 'recent') {
      setSelectedCollectionId(null)
      setActiveFilterId('recent')
      // Show links from the last 7 days, sorted by most recent first (excluding archived)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentLinks = links
        .filter(l => new Date(l.createdAt) >= sevenDaysAgo && !l.isArchived)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setFilteredLinks(recentLinks)
      return
    }
    if (id === 'archived') {
      setSelectedCollectionId(null)
      setActiveFilterId('archived')
      const archivedLinks = links.filter(l => l.isArchived)
      setFilteredLinks(archivedLinks)
      return
    }
    
    // Filter by collectionId
    setSelectedCollectionId(id)
    setActiveFilterId(null)
    // Exclude archived links from collection view
    const collectionLinks = links.filter(l => l.collectionId === id && !l.isArchived)
    setFilteredLinks(collectionLinks)
  }

  // Handle create collection
  const handleCreateCollection = async (collectionData: Omit<Collection, 'id' | 'userId' | 'linkCount' | 'createdAt' | 'updatedAt'>) => {
    try {
      logger.info('Creating collection', { component: 'Dashboard', action: 'createCollection', metadata: { name: collectionData.name } })
      
      const createdCollection = await makeRequest<Collection>('/api/collections', {
        method: 'POST',
        body: JSON.stringify(collectionData),
      })
      
      // Refresh collections using debounced function
      refetchCollections()
      
      logger.info('Collection created successfully', { component: 'Dashboard', action: 'createCollection', metadata: { collectionId: createdCollection.id } })
      
      toast.success('Project created successfully!')
      setShowCreateCollectionModal(false)
      
      // Navigate to the new collection (clear createCollection param)
      if (createdCollection.id) {
        navigate('/?collection=' + createdCollection.id, { replace: true })
      } else {
        // Clear createCollection param if no ID
        const params = new URLSearchParams(location.search)
        params.delete('createCollection')
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
      }
    } catch (error) {
      logger.error('Failed to create project', { component: 'Dashboard', action: 'createCollection', metadata: collectionData }, error as Error)
      
      // More detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        toast.error('A project with this name already exists. Please choose a different name.')
      } else {
        toast.error(`Failed to create project: ${errorMessage}`)
      }
    }
  }

  // Handle add link
  const handleAddLink = async (linkData: Omit<Link, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'clickCount'>) => {
    try {
      const savedLink = await makeRequest<Link>('/api/links', {
        method: 'POST',
        body: JSON.stringify({
          url: linkData.url,
          title: linkData.title,
          description: linkData.description,
          category: linkData.category,
          tags: linkData.tags,
          contentType: linkData.contentType,
          isFavorite: linkData.isFavorite,
          isArchived: linkData.isArchived,
          ...(linkData.collectionId && { collectionId: linkData.collectionId }),
        }),
      })
      // Refresh links from backend - useEffect will handle filteredLinks based on active view
      const refreshedLinks = await getLinks()
      setLinks(refreshedLinks)
      
      // If link was added to a collection, refresh collections to update counts
      if (linkData.collectionId) {
        refetchCollections()
      }
      
      toast.success('Link added successfully!')
      setShowAddModal(false) // Close modal on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Failed to add link:', errorMessage, error)
      toast.error('Failed to add link. Please try again.')
    }
  }

  const filteredLinksCount = filteredLinks.length
  const favoritesCount = links.filter(l => l.isFavorite && !l.isArchived).length

  // Handle export
  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLinks, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `smartrack-links-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast.success('Links exported successfully!')
  }

  // Handle extension download
  const handleDownloadExtension = () => {
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', '/SmarTrack-extension-v1.0.0.zip')
    linkElement.setAttribute('download', 'SmarTrack-extension-v1.0.0.zip')
    linkElement.click()
    toast.success('Extension download started!')
  }

  // Handle extension install button click
  const handleExtensionInstallClick = () => {
    setShowExtensionInstallModal(true)
  }

  // Animation variants - Optimized for mobile
  const fadeInUp = {
    hidden: { opacity: 0, y: animationConfig.movementDistance },
    visible: { 
      opacity: 1, 
      y: 0
    }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: animationConfig.staggerDelay,
        delayChildren: 0.05
      }
    }
  }

  const staggerItem = {
    hidden: { opacity: 0, y: animationConfig.movementDistance * 0.6 },
    visible: {
      opacity: 1,
      y: 0
    }
  }

  const shouldAnimate = !prefersReducedMotion

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/10 pb-8 sm:pb-6 md:pb-0">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        
        {/* Extension Install Banner - Removed per user request */}
        {false && !isExtensionInstalled && isAuthenticated && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg shadow-lg"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <Chrome className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Install the SmarTrack Extension</h3>
                  <p className="text-sm text-blue-100">
                    Get the full power of SmarTrack! Save any webpage with one click, extract content automatically, and access your library from anywhere.
                  </p>
                </div>
              </div>
              <button
                onClick={handleExtensionInstallClick}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm whitespace-nowrap flex items-center gap-2"
              >
                <Chrome className="w-4 h-4" />
                Get Started
              </button>
            </div>
          </motion.div>
        )}

        {/* ✅ ENHANCED TOOLBAR: Mobile-first design with better spacing */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: animationConfig.duration, ease: "easeOut" }}
          className="relative z-20 bg-white/98 backdrop-blur-sm rounded-2xl sm:rounded-2xl shadow-lg shadow-gray-900/5 border border-gray-200/80 mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 md:p-5"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 md:gap-4">
            {/* Left: Search with integrated Filter */}
            <div className="flex-1 min-w-0 order-1 relative">
              <div className="relative flex items-center">
                <SearchAutocomplete
                  value={searchQuery}
                  onChange={setSearchQuery}
                  links={links}
                  placeholder={isMobile ? "Search links..." : "Search your library..."}
                />
                {/* Filter Button inside Search */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20">
                  <FiltersDropdown
                    filters={{
                      category: filters.category,
                      dateRange: filters.dateRange,
                      tags: filters.tags,
                      contentType: filters.contentType,
                    }}
                    onFiltersChange={(newFilters) => {
                      setFilters(prev => ({
                        ...prev,
                        ...newFilters
                      }))
                    }}
                    iconOnly={true}
                  />
                </div>
              </div>
            </div>

            {/* Right: Action Buttons - mobile-first with perfect touch targets */}
            <div className="flex items-stretch sm:items-center gap-2 sm:gap-2.5 md:gap-3 flex-shrink-0 order-2 w-full sm:w-auto">
              {/* Action Buttons - optimized for mobile with larger touch areas */}
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-initial px-4 sm:px-5 md:px-6 py-3.5 sm:py-2.5 md:py-2.5 text-base sm:text-sm font-bold sm:font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 active:from-blue-800 active:via-blue-800 active:to-indigo-800 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 min-h-[52px] sm:min-h-[44px] md:min-h-[42px] touch-manipulation"
                aria-label="Add new link"
              >
                <Plus className="w-5 h-5 sm:w-4.5 sm:h-4.5 flex-shrink-0" />
                <span className="sm:hidden font-semibold">Add Link</span>
                <span className="hidden sm:inline md:hidden">New</span>
                <span className="hidden md:inline">New Link</span>
              </button>
              
              <button 
                onClick={handleExport}
                disabled={filteredLinksCount === 0}
                className="hidden sm:flex sm:flex-initial px-4 sm:px-5 md:px-6 py-3.5 sm:py-2.5 md:py-2.5 text-base sm:text-sm font-bold sm:font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:shadow-md active:bg-gray-100 active:shadow-sm active:scale-[0.96] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm items-center justify-center gap-2 min-h-[52px] sm:min-h-[44px] md:min-h-[42px] touch-manipulation"
                aria-label="Export links"
                title={filteredLinksCount === 0 ? 'No links to export' : 'Export filtered links'}
              >
                <Download className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Install Extension button removed per user request */}
              {false && !isExtensionInstalled && !isMobile && (
                <button 
                  onClick={handleExtensionInstallClick}
                  className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-800 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 touch-manipulation"
                  aria-label="Install Chrome extension"
                  title="Install SmarTrack Chrome Extension - Get step-by-step instructions"
                >
                  <Chrome className="w-4 h-4 flex-shrink-0" />
                  <span className="sm:hidden md:inline">Install Extension</span>
                  <span className="hidden sm:inline md:hidden">Install</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ✅ ENHANCED SECONDARY HEADER: Mobile-optimized with better spacing */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: shouldAnimate ? 0.05 : 0, duration: animationConfig.duration, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6"
        >
          {/* Left: Collection Title and Stats - mobile-first design */}
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-wrap w-full sm:w-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl md:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                <Archive className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
              </div>
              <span className="truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {selectedCollectionId 
                  ? collections.find(c => c.id === selectedCollectionId)?.name || 'Collection'
                  : activeFilterId === 'favorites'
                    ? 'Favorites'
                    : activeFilterId === 'archived'
                      ? 'Archived'
                      : 'All Links'}
              </span>
            </h2>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="px-3 sm:px-3.5 md:px-4 py-1.5 sm:py-1.5 md:py-2 text-xs sm:text-sm md:text-sm font-bold text-blue-700 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full border border-blue-200/80 shadow-sm whitespace-nowrap backdrop-blur-sm">
                {filteredLinksCount} {filteredLinksCount === 1 ? 'link' : 'links'}
              </span>
            </div>
          </div>

          {/* Right: View Controls - mobile-optimized with perfect touch targets */}
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 w-full sm:w-auto justify-end">
            {/* View Toggle - optimized for mobile with larger touch areas */}
            <div className="flex items-center gap-1 bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200/60 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3.5 sm:px-4 md:px-4 py-2.5 sm:py-2 md:py-2 rounded-lg transition-all duration-200 text-sm sm:text-sm font-bold sm:font-semibold flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[40px] md:min-h-[38px] touch-manipulation active:scale-[0.96] ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-5 h-5 sm:w-4.5 sm:h-4.5" />
                <span className="sm:hidden">List</span>
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3.5 sm:px-4 md:px-4 py-2.5 sm:py-2 md:py-2 rounded-lg transition-all duration-200 text-sm sm:text-sm font-bold sm:font-semibold flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[40px] md:min-h-[38px] touch-manipulation active:scale-[0.96] ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-md shadow-blue-500/10' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid className="w-5 h-5 sm:w-4.5 sm:h-4.5" />
                <span className="sm:hidden">Grid</span>
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={shouldAnimate ? "hidden" : "visible"}
          animate="visible"
          variants={fadeInUp}
          transition={{ delay: shouldAnimate ? 0.1 : 0, duration: animationConfig.duration, ease: "easeOut" }}
          className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:gap-8"
        >
          {/* Content */}
          <motion.div>
            {/* Links Section */}
            {loading && links.length === 0 ? (
              <DashboardSkeleton />
            ) : loading ? (
              <div className="card p-6">
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="h-10 w-10 rounded bg-slate-200" />
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                      </div>
                      <div className="h-6 w-16 rounded bg-slate-100" />
                    </div>
                  ))}
                  {slowLoading && (
                    <div className="pt-4 text-center">
                      <p className="text-sm text-orange-600 mb-2 font-medium">⏱️ Backend is warming up...</p>
                      <p className="text-xs text-gray-500 mb-3">First load may take 30-60 seconds</p>
                      <button onClick={() => window.location.reload()} className="btn btn-secondary text-sm">Refresh</button>
                    </div>
                  )}
                </div>
              </div>
            ) : filteredLinks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xl shadow-gray-900/5 overflow-hidden"
              >
                <div className="relative">
                  {/* Enhanced decorative background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-indigo-50/20 via-white to-purple-50/30 pointer-events-none" />
                  
                  <div className="relative p-5 sm:p-7 md:p-10 lg:p-14">
                    <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto">
                      {links.length === 0 ? (
                        <>
                          {/* Hero Section - Enhanced Mobile Design */}
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="relative mb-5 sm:mb-7 md:mb-9"
                          >
                            <div className="relative">
                              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-3xl sm:rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                                <Archive className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white" />
                              </div>
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 200 }}
                                className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl ring-2 sm:ring-3 ring-white"
                              >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </motion.div>
                            </div>
                          </motion.div>
                          
                          {/* Welcome Text - Mobile-First Typography */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="mb-6 sm:mb-7 md:mb-8"
                          >
                            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 tracking-tight px-1">
                              Welcome to SmarTrack
                            </h3>
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-3">
                              Your personal research library. Start collecting, organizing, and discovering knowledge.
                            </p>
                          </motion.div>
                          
                          {/* Primary CTA - Mobile-Optimized (Hidden if toolbar button exists) */}
                          {!isMobile && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4, duration: 0.6 }}
                              className="mb-8 sm:mb-10 md:mb-12 w-full sm:w-auto"
                            >
                              <button 
                                onClick={() => setShowAddModal(true)}
                                className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 md:py-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all font-semibold text-sm sm:text-base md:text-lg flex items-center justify-center gap-2.5 sm:gap-3 mx-auto shadow-xl shadow-blue-600/25 hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-0.5 sm:hover:-translate-y-1 active:translate-y-0 touch-manipulation min-h-[48px] sm:min-h-0"
                              >
                                <Plus className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                                <span>Add Your First Link</span>
                              </button>
                            </motion.div>
                          )}
                          
                          {/* Platform Support Section - Mobile Optimized */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="mb-6 sm:mb-8 md:mb-10 w-full"
                          >
                            <h4 className="text-sm sm:text-base md:text-lg font-bold sm:font-semibold text-slate-700 mb-4 sm:mb-5 md:mb-6 text-center px-2">
                              Save content from anywhere
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4 max-w-4xl mx-auto px-1 sm:px-0">
                              {[
                                {
                                  name: 'LinkedIn',
                                  icon: <LinkedInLogo />,
                                  bgColor: 'bg-blue-50',
                                  textColor: 'text-[#0077B5]',
                                  borderColor: 'border-blue-200',
                                  hoverBorder: 'hover:border-blue-300'
                                },
                                {
                                  name: 'X (Twitter)',
                                  icon: <XLogo />,
                                  bgColor: 'bg-slate-50',
                                  textColor: 'text-slate-900',
                                  borderColor: 'border-slate-200',
                                  hoverBorder: 'hover:border-slate-300'
                                },
                                {
                                  name: 'Reddit',
                                  icon: <RedditLogo />,
                                  bgColor: 'bg-orange-50',
                                  textColor: 'text-[#FF4500]',
                                  borderColor: 'border-orange-200',
                                  hoverBorder: 'hover:border-orange-300'
                                },
                                {
                                  name: 'YouTube',
                                  icon: <YouTubeLogo />,
                                  bgColor: 'bg-red-50',
                                  textColor: 'text-[#FF0000]',
                                  borderColor: 'border-red-200',
                                  hoverBorder: 'hover:border-red-300'
                                },
                                {
                                  name: 'Web Pages',
                                  icon: <WebIcon />,
                                  bgColor: 'bg-green-50',
                                  textColor: 'text-green-600',
                                  borderColor: 'border-green-200',
                                  hoverBorder: 'hover:border-green-300'
                                },
                                {
                                  name: 'PDFs',
                                  icon: <PDFIcon />,
                                  bgColor: 'bg-purple-50',
                                  textColor: 'text-purple-600',
                                  borderColor: 'border-purple-200',
                                  hoverBorder: 'hover:border-purple-300'
                                }
                              ].map((platform, index) => (
                                <motion.div
                                  key={platform.name}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                                  whileHover={!isMobile ? { y: -4, scale: 1.05, transition: { duration: 0.2 } } : {}}
                                  className={`p-3 sm:p-3.5 md:p-4 bg-white border-2 ${platform.borderColor} ${platform.hoverBorder} rounded-xl sm:rounded-xl md:rounded-xl transition-all group cursor-default touch-manipulation text-center active:scale-[0.96]`}
                                >
                                  <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${platform.bgColor} rounded-xl sm:rounded-2xl md:rounded-2xl flex items-center justify-center mb-2 sm:mb-2.5 md:mb-3 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-sm group-hover:shadow-md`}>
                                    <div className={platform.textColor}>
                                      {platform.icon}
                                    </div>
                                  </div>
                                  <div className="text-xs sm:text-sm md:text-sm font-semibold sm:font-medium text-slate-900 leading-tight">{platform.name}</div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>

                          {/* Feature Cards - Mobile-First Design */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6 w-full px-1 sm:px-0"
                          >
                            <motion.div
                              whileHover={!isMobile ? { y: -6, scale: 1.02, transition: { duration: 0.2 } } : {}}
                              whileTap={isMobile ? { scale: 0.96 } : {}}
                              className="p-5 sm:p-6 md:p-7 bg-white border-2 border-slate-200 rounded-2xl sm:rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all group cursor-pointer touch-manipulation active:scale-[0.97]"
                            >
                              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-3.5 sm:mb-4 md:mb-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 flex items-center justify-center transition-all shadow-sm group-hover:shadow-md">
                                <Plus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
                              </div>
                              <div className="font-bold text-base sm:text-lg md:text-xl text-slate-900 mb-2 sm:mb-2.5">Save Links</div>
                              <div className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">Capture articles, videos, and resources with one click</div>
                            </motion.div>
                            
                            <motion.div
                              whileHover={!isMobile ? { y: -6, scale: 1.02, transition: { duration: 0.2 } } : {}}
                              whileTap={isMobile ? { scale: 0.96 } : {}}
                              className="p-5 sm:p-6 md:p-7 bg-white border-2 border-slate-200 rounded-2xl sm:rounded-2xl hover:border-purple-300 hover:shadow-lg transition-all group cursor-pointer touch-manipulation active:scale-[0.97]"
                            >
                              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-3.5 sm:mb-4 md:mb-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200 flex items-center justify-center transition-all shadow-sm group-hover:shadow-md">
                                <Tag className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600" />
                              </div>
                              <div className="font-bold text-base sm:text-lg md:text-xl text-slate-900 mb-2 sm:mb-2.5">Organize</div>
                              <div className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">Tag and categorize your research for easy discovery</div>
                            </motion.div>
                            
                            <motion.div
                              whileHover={!isMobile ? { y: -6, scale: 1.02, transition: { duration: 0.2 } } : {}}
                              whileTap={isMobile ? { scale: 0.96 } : {}}
                              className="p-5 sm:p-6 md:p-7 bg-white border-2 border-slate-200 rounded-2xl sm:rounded-2xl hover:border-green-300 hover:shadow-lg transition-all group cursor-pointer touch-manipulation sm:col-span-2 md:col-span-1 active:scale-[0.97]"
                            >
                              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-3.5 sm:mb-4 md:mb-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-200 flex items-center justify-center transition-all shadow-sm group-hover:shadow-md">
                                <Archive className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
                              </div>
                              <div className="font-bold text-base sm:text-lg md:text-xl text-slate-900 mb-2 sm:mb-2.5">Discover</div>
                              <div className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">Search and find what you need instantly</div>
                            </motion.div>
                          </motion.div>
                        </>
                      ) : (
                    <>
                      {/* ✅ ENHANCED EMPTY STATE: Premium design with better visual hierarchy */}
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-6"
                      >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg shadow-blue-500/10">
                          <div className="text-4xl sm:text-5xl">🔍</div>
                        </div>
                      </motion.div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {searchQuery 
                          ? 'No links match your search' 
                          : activeFilterId === 'archived' 
                            ? 'No archived links yet'
                            : activeFilterId === 'favorites'
                              ? 'No favorites yet'
                              : 'No links found'
                        }
                      </h3>
                      <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                        {searchQuery ? (
                          <>Try different keywords or check your spelling. You can search by title, description, URL, or tags.</>
                        ) : activeFilterId === 'archived' ? (
                          <>Archived links are hidden from your main view. Unarchive them to see them again.</>
                        ) : activeFilterId === 'favorites' ? (
                          <>Mark links as favorites by clicking the star icon. Your favorites will appear here.</>
                        ) : filters.category || filters.tags.length > 0 || filters.dateRange !== 'all_time' ? (
                          <>Your current filters are too restrictive. Try adjusting them to see more results.</>
                        ) : (
                          <>No links match your current view. Try changing your filters or search terms.</>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                            aria-label="Clear search"
                          >
                            Clear Search
                          </button>
                        )}
                        {(filters.category || filters.tags.length > 0 || filters.dateRange !== 'all_time' || searchQuery) && (
                          <button 
                            onClick={() => {
                              setSearchQuery('')
                              handleCollectionSelect('all')
                              setFilters({
                                category: '',
                                dateRange: 'all_time',
                                tags: [],
                                contentType: ''
                              })
                              setActiveFilterId(null)
                            }}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md shadow-blue-500/25"
                            aria-label="Clear all filters"
                          >
                            Clear All Filters
                          </button>
                        )}
                        {links.length > 0 && (
                          <button 
                            onClick={() => setShowAddModal(true)}
                            className="px-5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 shadow-sm"
                            aria-label="Add new link"
                          >
                            <Plus className="w-4 h-4" />
                            Add New Link
                          </button>
                        )}
                      </div>
                    </>
                  )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={shouldAnimate ? "hidden" : "visible"}
                animate="visible"
                variants={staggerContainer}
              >
                {selectedLinks.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-5 p-4 sm:p-5 md:p-5 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 border-2 border-blue-200/80 rounded-2xl shadow-lg shadow-blue-500/10 backdrop-blur-sm"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                      <span className="text-base sm:text-base md:text-lg font-bold text-blue-900 flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm sm:text-sm md:text-base font-bold shadow-md shadow-blue-500/30">
                          {selectedLinks.size}
                        </span>
                        <span className="bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
                          link{selectedLinks.size > 1 ? 's' : ''} selected
                        </span>
                      </span>
                      <div className="flex gap-2.5 w-full sm:w-auto">
                        <button 
                          onClick={clearSelection} 
                          className="flex-1 sm:flex-initial px-4 sm:px-4 py-2.5 sm:py-2 bg-white/80 backdrop-blur-sm text-gray-700 border-2 border-gray-300 rounded-xl text-sm font-bold sm:font-semibold hover:bg-white hover:shadow-md active:scale-[0.97] transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={selectAll} 
                          className="flex-1 sm:flex-initial px-4 sm:px-4 py-2.5 sm:py-2 bg-white/80 backdrop-blur-sm text-gray-700 border-2 border-gray-300 rounded-xl text-sm font-bold sm:font-semibold hover:bg-white hover:shadow-md active:scale-[0.97] transition-all duration-200 min-h-[44px] sm:min-h-0 touch-manipulation"
                        >
                          Select All
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                      <button 
                        onClick={handleBulkArchive}
                        disabled={isLoading}
                        className="px-4 sm:px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center gap-2 shadow-sm"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <span>Archiving...</span>
                          </>
                        ) : (
                          <>
                            <Archive className="w-4 h-4" />
                            <span>Archive</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={handleBulkFavorite}
                        disabled={isLoading}
                        className="px-4 sm:px-5 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center gap-2 shadow-sm"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-amber-600 rounded-full animate-spin"></div>
                            <span>Favoriting...</span>
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4" />
                            <span>Favorite</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={async () => {
                          // Bulk delete with confirmation
                          if (confirm(`Delete ${selectedLinks.size} selected links?`)) {
                            try {
                              setLoading(true)
                              const linkIds = Array.from(selectedLinks)
                              const deletedLinks = links.filter(l => selectedLinks.has(l.id))
                              const hadCollectionLinks = deletedLinks.some(l => l.collectionId)
                              
                              await Promise.all(
                                linkIds.map(linkId => 
                                  makeRequest(`/api/links/${linkId}`, {
                                    method: 'DELETE',
                                  })
                                )
                              )
                              setLinks(links.filter(l => !selectedLinks.has(l.id)))
                              clearSelection()
                              
                              // If any deleted links were in collections, refresh collection counts
                              if (hadCollectionLinks) {
                                refetchCollections()
                              }
                              
                              toast.success(`${linkIds.length} link(s) deleted successfully`)
                            } catch (error) {
                              const errorMessage = error instanceof Error ? error.message : String(error)
                              console.error('Failed to delete links:', errorMessage, error)
                              toast.error('Failed to delete some links. Please try again.')
                            } finally {
                              setLoading(false)
                            }
                          }
                        }}
                        disabled={loading}
                        className="px-4 sm:px-5 py-2.5 bg-red-50 text-red-700 border border-red-300 rounded-xl text-sm font-semibold hover:bg-red-100 hover:border-red-400 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center gap-2 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {/* Links Display - Grouped by Category */}
                {(() => {
                  // Group links by category
                  const groupedLinks = filteredLinks.reduce((acc, link) => {
                    const category = link.category || 'Uncategorized'
                    if (!acc[category]) {
                      acc[category] = []
                    }
                    acc[category].push(link)
                    return acc
                  }, {} as Record<string, typeof filteredLinks>)

                  // Sort categories by link count (descending) then alphabetically
                  const sortedCategories = Object.entries(groupedLinks).sort((a, b) => {
                    if (b[1].length !== a[1].length) {
                      return b[1].length - a[1].length
                    }
                    return a[0].localeCompare(b[0])
                  })

                  return (
                    <motion.div
                      variants={staggerContainer}
                      className="relative z-0 space-y-6 sm:space-y-7 md:space-y-8"
                    >
                      {/* Summary Stats Bar - Show when links exist */}
                      {filteredLinks.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 rounded-xl sm:rounded-2xl border border-blue-200/60 p-4 sm:p-5 mb-4 sm:mb-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                                <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm sm:text-base font-semibold text-gray-700">Total Links</div>
                                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                                  {filteredLinks.length} {filteredLinks.length === 1 ? 'link' : 'links'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                              <div className="text-center">
                                <div className="text-xs sm:text-sm text-gray-600">Categories</div>
                                <div className="text-lg sm:text-xl font-bold text-blue-600">{sortedCategories.length}</div>
                              </div>
                              {favoritesCount > 0 && (
                                <div className="text-center">
                                  <div className="text-xs sm:text-sm text-gray-600">Favorites</div>
                                  <div className="text-lg sm:text-xl font-bold text-amber-600">{favoritesCount}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Category Groups */}
                      {sortedCategories.map(([category, categoryLinks]) => (
                        <motion.div
                          key={category}
                          variants={staggerItem}
                          className="mb-6 sm:mb-7 md:mb-8"
                        >
                          {/* Enhanced Category Header */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-200/60"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                              <div className="w-1.5 h-8 sm:h-10 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-600 rounded-full shadow-sm shadow-blue-500/30"></div>
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">{category}</h3>
                              <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 rounded-full text-xs sm:text-sm font-bold border border-blue-200/80 shadow-sm">
                                {categoryLinks.length} {categoryLinks.length === 1 ? 'link' : 'links'}
                              </span>
                            </div>
                          </motion.div>

                          {/* Links for this category - enhanced spacing */}
                          <div className={viewMode === 'grid' 
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6' 
                            : 'flex flex-col gap-3 sm:gap-4'
                          }>
                            {categoryLinks.map((link, index) => (
                              <motion.div
                                key={link.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ 
                                  delay: index * 0.05,
                                  duration: 0.4,
                                  ease: [0.16, 1, 0.3, 1]
                                }}
                              >
                                <LinkCard
                                  link={link}
                                  viewMode={viewMode}
                                  isSelected={selectedLinks.has(link.id)}
                                  onSelect={() => toggleSelection(link.id)}
                                  onAction={handleLinkAction}
                                  collections={collections}
                                  onCardClick={() => setEditingLink(link)}
                                />
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )
                })()}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddLink}
        collections={collections}
        existingCategories={Array.from(new Set(links.map(l => l.category).filter(Boolean)))}
      />

      {/* Edit Link Modal */}
      <EditLinkModal
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        onSave={handleEditLink}
        link={editingLink}
        collections={collections}
        existingCategories={Array.from(new Set(links.map(l => l.category).filter(Boolean)))}
      />

      {/* Extension Install Modal */}
      <ExtensionInstallModal
        isOpen={showExtensionInstallModal}
        onClose={() => setShowExtensionInstallModal(false)}
        onDownload={handleDownloadExtension}
      />

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={showCreateCollectionModal}
        onClose={() => {
          setShowCreateCollectionModal(false)
          // Clear createCollection param from URL when modal closes
          const params = new URLSearchParams(location.search)
          params.delete('createCollection')
          navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
        }}
        onCreate={handleCreateCollection}
      />
    </div>
  )
}
