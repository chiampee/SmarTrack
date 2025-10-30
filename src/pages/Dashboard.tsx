import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus, Grid, List, Star, Download, Loader2 } from 'lucide-react'
import { CollectionSidebar } from '../components/CollectionSidebar'
import { LinkCard } from '../components/LinkCard'
import { SearchAutocomplete } from '../components/SearchAutocomplete'
import { AddLinkModal } from '../components/AddLinkModal'
import { EditLinkModal } from '../components/EditLinkModal'
import { CreateCollectionModal } from '../components/CreateCollectionModal'
import { FiltersDropdown } from '../components/FiltersDropdown'
import { useBackendApi } from '../hooks/useBackendApi'
import { useToast } from '../components/Toast'
import { useCategories } from '../context/CategoriesContext'
import { Link, Collection, Category } from '../types/Link'

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
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    category: '',
    dateRange: 'all_time' as 'today' | 'last_week' | 'last_month' | 'last_year' | 'all_time',
    tags: [] as string[],
    contentType: '' as Link['contentType'] | ''
  })
  const { getLinks, isAuthenticated, makeRequest } = useBackendApi()
  const toast = useToast()
  const { computeCategories, setCategories } = useCategories()
  const [collections, setCollections] = useState<Collection[]>([])
  const [categories, setCategoriesState] = useState<Category[]>([])
  const location = useLocation()
  const navigate = useNavigate()

  // Load links from backend
  useEffect(() => {
    const fetchLinks = async () => {
      // Don't fetch if not authenticated yet
      if (!isAuthenticated) {
        return
      }

      try {
        setLoading(true)
        setSlowLoading(false)
        const slowTimer = setTimeout(() => setSlowLoading(true), 6000)
        const data = await getLinks()
        clearTimeout(slowTimer)
        setLinks(data || [])
        setFilteredLinks(data || [])
        
        // Update categories with link counts
        const computedCategories = computeCategories(data || [])
        setCategories(computedCategories)
      } catch (error) {
        console.error('Failed to fetch links:', error)
        // Silently fail - already handled in getLinks
      } finally {
        setLoading(false)
        setSlowLoading(false)
      }
    }
    
    fetchLinks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  // React to sidebar query params: filter, collection, category
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const filter = params.get('filter')
    const collection = params.get('collection')
    const categoryParam = params.get('category')
    const createCollection = params.get('createCollection')

    if (!filter && !collection && !categoryParam) {
      setSelectedCollectionId(null)
      setActiveFilterId(null)
      setFilteredLinks(links)
      return
    }

    if (collection) {
      setSelectedCollectionId(collection)
      setActiveFilterId(null)
      setFilteredLinks(links.filter(l => l.collectionId === collection))
      return
    }

    switch (filter) {
      case 'favorites': {
        setSelectedCollectionId(null)
        setActiveFilterId('favorites')
        setFilteredLinks(links.filter(l => l.isFavorite))
        break
      }
      case 'recent': {
        setSelectedCollectionId(null)
        setActiveFilterId('recent')
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recentLinks = links
          .filter(l => new Date(l.createdAt) >= sevenDaysAgo)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setFilteredLinks(recentLinks)
        break
      }
      case 'archived': {
        setSelectedCollectionId(null)
        setActiveFilterId('archived')
        setFilteredLinks(links.filter(l => l.isArchived))
        break
      }
      default: {
        if (categoryParam) {
          setSelectedCollectionId(null)
          setActiveFilterId(null)
          const catLower = categoryParam.toLowerCase()
          setFilteredLinks(links.filter(l => (l.category || '').toLowerCase() === catLower))
        } else {
          setSelectedCollectionId(null)
          setActiveFilterId(null)
          setFilteredLinks(links)
        }
      }
    }

    if (createCollection === '1') {
      setShowCreateCollectionModal(true)
    }
  }, [location.search, links])

  // Load collections and categories from backend
  useEffect(() => {
    const fetchMeta = async () => {
      if (!isAuthenticated) return
      try {
        // Fetch categories and collections
        const [cats, cols] = await Promise.all([
          makeRequest<Category[]>('/api/categories'),
          makeRequest<Collection[]>('/api/collections')
        ])
        setCategoriesState(cats || [])
        setCollections(cols || [])
      } catch (e) {
        console.error('Failed to load metadata:', e)
      }
    }
    fetchMeta()
  }, [isAuthenticated, makeRequest])

  // Filter links based on search and filters
  useEffect(() => {
    // If a collection is selected, don't apply other filters
    if (selectedCollectionId) {
      return
    }

    let filtered = links

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
  }, [links, searchQuery, filters, selectedCollectionId])

  // Handle link actions
  const handleLinkAction = async (linkId: string, action: string) => {
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
          await makeRequest(`/api/links/${linkId}`, {
            method: 'DELETE',
          })
          setLinks(links.filter(l => l.id !== linkId))
          toast.success('Link deleted')
        } catch (error) {
          console.error('Failed to delete link:', error)
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
          console.error('Failed to toggle favorite:', error)
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
          console.error('Failed to toggle archive:', error)
          toast.error('Failed to update archive status. Please try again.')
        }
        break
    }
  }

  // Handle edit link save
  const handleEditLink = async (linkId: string, updates: Partial<Link>) => {
    try {
      await makeRequest(`/api/links/${linkId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          category: updates.category,
          tags: updates.tags,
          contentType: updates.contentType,
          isFavorite: updates.isFavorite,
          isArchived: updates.isArchived,
        }),
      })
      setLinks(links.map(l => 
        l.id === linkId ? { ...l, ...updates, updatedAt: new Date() } : l
      ))
      toast.success('Link updated successfully!')
    } catch (error) {
      console.error('Failed to update link:', error)
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

  // Handle collection/category selection from sidebar
  const handleCollectionSelect = (id: string) => {
    // Show all links
    if (id === 'all') {
      setSelectedCollectionId(null)
      setActiveFilterId(null)
      setFilteredLinks(links)
      return
    }
    
    // Quick filters
    if (id === 'favorites') {
      setSelectedCollectionId(null)
      setActiveFilterId('favorites')
      const favoriteLinks = links.filter(l => l.isFavorite)
      setFilteredLinks(favoriteLinks)
      return
    }
    if (id === 'recent') {
      setSelectedCollectionId(null)
      setActiveFilterId('recent')
      // Show links from the last 7 days, sorted by most recent first
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentLinks = links
        .filter(l => new Date(l.createdAt) >= sevenDaysAgo)
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
    const collectionLinks = links.filter(l => l.collectionId === id)
    setFilteredLinks(collectionLinks)
  }

  // Handle create collection
  const handleCreateCollection = async (collectionData: Omit<Collection, 'id' | 'userId' | 'linkCount' | 'createdAt' | 'updatedAt'>) => {
    try {
      await makeRequest<Collection>('/api/collections', {
        method: 'POST',
        body: JSON.stringify(collectionData),
      })
      // Refresh collections
      const updatedCollections = await makeRequest<Collection[]>('/api/collections')
      setCollections(updatedCollections || [])
      toast.success('Project created successfully!')
      setShowCreateCollectionModal(false)
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project. Please try again.')
    }
  }

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    // Cleanup if needed
  }

  // Handle drop on collection
  const handleDropOnCollection = async (collectionId: string, linkId: string) => {
    try {
      // Update the link to add it to the collection
      const link = links.find(l => l.id === linkId)
      if (!link) {
        return
      }

      await makeRequest(`/api/links/${linkId}`, {
        method: 'PUT',
        body: JSON.stringify({
          collectionId: collectionId,
        }),
      })

      // Update local state
      setLinks(links.map(l => 
        l.id === linkId ? { ...l, collectionId } : l
      ))
      
      toast.success('Link added to collection!')
      
      // Refresh links to get updated data
      const refreshedLinks = await getLinks()
      
      setLinks(refreshedLinks)
      setFilteredLinks(refreshedLinks)
    } catch (error) {
      console.error('Failed to add link to collection:', error)
      toast.error('Failed to add link to collection. Please try again.')
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
        }),
      })
      // Refresh links from backend to ensure consistency
      const refreshedLinks = await getLinks()
      setLinks(refreshedLinks)
      setFilteredLinks(refreshedLinks)
      toast.success('Link added successfully!')
      setShowAddModal(false) // Close modal on success
    } catch (error) {
      console.error('Failed to add link:', error)
      toast.error('Failed to add link. Please try again.')
    }
  }

  const filteredLinksCount = filteredLinks.length
  const favoritesCount = links.filter(l => l.isFavorite).length

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleCollectionSelect('all')}
                  className="text-3xl font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer transition-all duration-200"
                >
                  Research Dashboard
                </button>
                {selectedCollectionId && (
                  <>
                    <span className="text-gray-400 select-none">/</span>
                    <button
                      className="text-2xl font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {collections.find(c => c.id === selectedCollectionId)?.name || 'Collection'}
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-900">{filteredLinksCount}</span>
                  <span className="text-gray-500">links</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-gray-900">{favoritesCount}</span>
                  <span className="text-gray-500">favorites</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                disabled={filteredLinksCount === 0}
                className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Link
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-6">
          {/* Quick Filters */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700 mr-2">Quick Filters:</span>
            <button
              onClick={() => setFilters({ ...filters, dateRange: 'today' })}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filters.dateRange === 'today'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilters({ ...filters, dateRange: 'last_week' })}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filters.dateRange === 'last_week'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilters({ ...filters, dateRange: 'last_month' })}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                filters.dateRange === 'last_month'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => {
                const favoritesFilter = links.filter(l => l.isFavorite)
                setFilteredLinks(favoritesFilter)
              }}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              ⭐ Favorites
            </button>
            <button
              onClick={() => setFilters({ ...filters, dateRange: 'all_time' })}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
            >
              Clear Filters
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                links={links}
                placeholder="Search your research library..."
              />
            </div>
            
            <div className="flex items-center gap-3">
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
              />
              
              <div className="flex items-center gap-1 border-l border-gray-300 pl-3">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Content */}
          <div>
            {/* Links Section */}
            {loading ? (
              <div className="card p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    {slowLoading && (
                      <>
                        <p className="text-sm text-gray-500">This is taking longer than usual…</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="btn btn-secondary text-sm"
                        >
                          Refresh
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="card p-6">
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium mb-2">No links found</h3>
                  <p className="text-sm">Start by adding your first research link</p>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="btn btn-primary mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Link
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {selectedLinks.size > 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-blue-800">
                        {selectedLinks.size} link{selectedLinks.size > 1 ? 's' : ''} selected
                      </span>
                      <div className="flex gap-2">
                        <button onClick={clearSelection} className="btn btn-secondary text-sm">
                          Clear
                        </button>
                        <button onClick={selectAll} className="btn btn-secondary text-sm">
                          Select All
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={() => {
                          // Bulk archive
                          Array.from(selectedLinks).forEach(linkId => {
                            handleLinkAction(linkId, 'toggleArchive')
                          })
                        }}
                        className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all"
                      >
                        📦 Archive
                      </button>
                      <button 
                        onClick={() => {
                          // Bulk favorite
                          Array.from(selectedLinks).forEach(linkId => {
                            handleLinkAction(linkId, 'toggleFavorite')
                          })
                        }}
                        className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-all"
                      >
                        ⭐ Favorite
                      </button>
                      <button 
                        onClick={() => {
                          // Bulk delete with confirmation
                          if (confirm(`Delete ${selectedLinks.size} selected links?`)) {
                            Array.from(selectedLinks).forEach(linkId => {
                              handleLinkAction(linkId, 'delete')
                            })
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-300 rounded-lg text-sm hover:bg-red-100 transition-all"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Group by Category */}
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

                  return (
                    <div className="space-y-6">
                      {Object.entries(groupedLinks).map(([category, links]) => (
                        <div key={category} className="mb-6">
                          {/* Category Header */}
                          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                              <h3 className="text-xl font-bold text-gray-800">{category}</h3>
                              <span className="px-3 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {links.length} {links.length === 1 ? 'link' : 'links'}
                              </span>
                            </div>
                          </div>

                          {/* Links for this category */}
                          <div className={viewMode === 'grid' 
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
                            : 'space-y-4'
                          }>
                            {links.map(link => (
                              <LinkCard
                                key={link.id}
                                link={link}
                                viewMode={viewMode}
                                isSelected={selectedLinks.has(link.id)}
                                onSelect={() => toggleSelection(link.id)}
                                onAction={handleLinkAction}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', link.id)
                                  e.dataTransfer.effectAllowed = 'move'
                                }}
                                onDragEnd={handleDragEnd}
                                collections={collections}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddLink}
        collections={collections}
      />

      {/* Edit Link Modal */}
      <EditLinkModal
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        onSave={handleEditLink}
        link={editingLink}
        collections={collections}
      />

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={showCreateCollectionModal}
        onClose={() => setShowCreateCollectionModal(false)}
        onCreate={handleCreateCollection}
      />
    </div>
  )
}
