import React, { useState } from 'react'
import { 
  BookOpen, 
  FileText, 
  Wrench, 
  Bookmark, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Star,
  Archive,
  Clock
} from 'lucide-react'
import { Collection, Category } from '../types/Link'

interface CollectionSidebarProps {
  collections: Collection[]
  categories: Category[]
  onCollectionSelect: (collectionId: string) => void
  onCreateCollection?: () => void
  onDropOnCollection?: (collectionId: string, linkId: string) => void
  activeCollectionId?: string | null
  activeFilterId?: string | null
}

export const CollectionSidebar: React.FC<CollectionSidebarProps> = ({
  collections,
  categories,
  onCollectionSelect,
  onCreateCollection,
  onDropOnCollection,
  activeCollectionId,
  activeFilterId
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['collections', 'categories']))
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const handleDragOver = (e: React.DragEvent, collectionId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (collectionId) {
      setDragOverCollectionId(collectionId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCollectionId(null)
  }

  const handleDrop = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCollectionId(null)
    
    const linkId = e.dataTransfer.getData('text/plain')
    
    if (linkId && onDropOnCollection) {
      onDropOnCollection(collectionId, linkId)
    }
  }

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'research':
        return <BookOpen className="w-4 h-4" />
      case 'articles':
        return <FileText className="w-4 h-4" />
      case 'tools':
        return <Wrench className="w-4 h-4" />
      case 'references':
        return <Bookmark className="w-4 h-4" />
      case 'project':
        return <FileText className="w-4 h-4" />
      case 'bookmark':
        return <Bookmark className="w-4 h-4" />
      case 'folder':
        return <FileText className="w-4 h-4" />
      case 'star':
        return <Star className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'research':
        return 'text-blue-600 bg-blue-100'
      case 'articles':
        return 'text-green-600 bg-green-100'
      case 'tools':
        return 'text-orange-600 bg-orange-100'
      case 'references':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="w-64 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📁</span>
            Collections
          </h2>
          {onCreateCollection && (
            <button 
              onClick={onCreateCollection}
              className="p-1.5 rounded-lg bg-white shadow-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              title="Create New Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="space-y-2">
          <button
            onClick={() => onCollectionSelect('all')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
              !activeCollectionId || activeCollectionId === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
            }`}
          >
            <span className="text-lg">📚</span>
            Show All Links
          </button>
          <button
            onClick={() => onCollectionSelect('favorites')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
              activeFilterId === 'favorites'
                ? 'bg-yellow-50 border border-yellow-300 text-yellow-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Star className="w-4 h-4 text-yellow-500" />
            Favorites
          </button>
          <button
            onClick={() => onCollectionSelect('recent')}
            title="Links from the last 7 days"
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
              activeFilterId === 'recent'
                ? 'bg-blue-50 border border-blue-300 text-blue-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-500" />
            <div className="flex-1 text-left">
              <div>Recent</div>
              <div className="text-xs text-gray-500">Last 7 days</div>
            </div>
          </button>
          <button
            onClick={() => onCollectionSelect('archived')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
              activeFilterId === 'archived'
                ? 'bg-gray-100 border border-gray-300 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Archive className="w-4 h-4 text-gray-500" />
            Archived
          </button>
        </div>
      </div>

      {/* Collections Section */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <button
            onClick={() => toggleSection('collections')}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
          >
            <span>My Collections</span>
            {expandedSections.has('collections') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections.has('collections') && (
            <div className="space-y-1">
              {collections.map((collection, idx) => (
                <button
                  key={collection.id}
                  onClick={() => onCollectionSelect(collection.id)}
                  onDragOver={(e) => handleDragOver(e, collection.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, collection.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                    dragOverCollectionId === collection.id 
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-500 border-dashed shadow-lg scale-[1.02]' 
                      : activeCollectionId === collection.id
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 text-blue-900 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <div 
                    className="p-1.5 rounded-lg shadow-sm" 
                    style={{ backgroundColor: `${collection.color}15`, color: collection.color }}
                  >
                    {getCategoryIcon(collection.icon || collection.name)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{collection.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="font-semibold text-gray-700">{(collection as any).linkCount || 0}</span>
                      <span>links</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Categories Section */}
          <div className="mt-6">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
            >
              <span>Categories</span>
              {expandedSections.has('categories') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {expandedSections.has('categories') && (
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => onCollectionSelect(category.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className={`p-1 rounded ${getCategoryColor(category.name)}`}>
                      {getCategoryIcon(category.name)}
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={onCreateCollection}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-white border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>
    </div>
  )
}
