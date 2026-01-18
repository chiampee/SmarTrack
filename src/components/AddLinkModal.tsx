import React, { useState, useEffect, useRef } from 'react'
import { X, Link as LinkIcon, Tag, FileText, Globe, Folder, ChevronDown } from 'lucide-react'
import { Link, Collection } from '../types/Link'

interface AddLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (link: Omit<Link, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'clickCount'>) => void
  collections?: Collection[]
  existingCategories?: string[] // ✅ NEW: Pass existing categories for suggestions
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  collections = [],
  existingCategories = []
}) => {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [collectionId, setCollectionId] = useState<string>('')
  const [tags, setTags] = useState('')
  const [contentType, setContentType] = useState<Link['contentType']>('webpage')
  const [isFavorite, setIsFavorite] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  // Predefined categories
  const predefinedCategories = ['Research', 'Articles', 'Tools', 'References', 'Tutorials']
  
  // ✅ ENHANCED: Combine predefined and existing categories, remove duplicates
  const allCategories = Array.from(new Set([
    ...predefinedCategories,
    ...existingCategories.filter(cat => cat && !predefinedCategories.includes(cat))
  ])).sort()

  // ✅ ENHANCED: Filter suggestions based on input
  const categorySuggestions = category
    ? allCategories.filter(cat => 
        cat.toLowerCase().includes(category.toLowerCase()) && 
        cat !== category
      )
    : allCategories

  // ✅ NEW: Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node) &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target as Node)
      ) {
        setShowCategorySuggestions(false)
      }
    }

    if (showCategorySuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategorySuggestions])

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate
    const newErrors: Record<string, string> = {}
    if (!url) {
      newErrors.url = 'URL is required'
    } else if (!validateUrl(url)) {
      newErrors.url = 'Invalid URL format'
    }
    if (!title) {
      newErrors.title = 'Title is required'
    }
    // ✅ FIXED: Validate category (must be non-empty after trim)
    if (!category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Parse tags
    const tagsArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    // ✅ FIXED: Use category directly (trimmed)
    const finalCategory = category.trim()

    // Create link object
    const link: Omit<Link, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'clickCount'> = {
      url,
      title,
      description: description || undefined,
      category: finalCategory,
      tags: tagsArray,
      contentType,
      isFavorite,
      isArchived,
      collectionId: collectionId || undefined,
    }

    onSave(link)

    // Reset form
    setUrl('')
    setTitle('')
    setDescription('')
    setCategory('')
    setTags('')
    setContentType('webpage')
    setIsFavorite(false)
    setIsArchived(false)
    setShowCategorySuggestions(false)
    onClose()
  }

  const handleClose = () => {
    setUrl('')
    setTitle('')
    setDescription('')
    setCategory('')
    setTags('')
    setContentType('webpage')
    setIsFavorite(false)
    setIsArchived(false)
    setShowCategorySuggestions(false)
    setErrors({})
    onClose()
  }

  // ✅ NEW: Handle category selection from suggestions
  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory)
    setShowCategorySuggestions(false)
    categoryInputRef.current?.focus()
  }

  // ✅ NEW: Handle category input change
  const handleCategoryChange = (value: string) => {
    setCategory(value)
    setShowCategorySuggestions(true)
  }

  const contentTypes: { value: Link['contentType']; label: string }[] = [
    { value: 'webpage', label: 'Web Page' },
    { value: 'pdf', label: 'PDF Document' },
    { value: 'article', label: 'Article' },
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image' },
    { value: 'document', label: 'Document' },
    { value: 'other', label: 'Other' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add New Link</h2>
            <p className="text-sm text-gray-500 mt-1 hidden sm:block">Save a new link to your research library</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 active:text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg p-2 transition-colors touch-manipulation flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-5 pb-28 sm:pb-6">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1.5" />
                URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={`input-field ${errors.url ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="url"
              />
              {errors.url && (
                <p className="mt-1.5 text-sm text-red-600">{errors.url}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1.5" />
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter link title"
                className={`input-field ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                autoCapitalize="sentences"
                autoComplete="off"
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter link description"
                rows={3}
                className="input-field resize-none"
                autoCapitalize="sentences"
              />
            </div>

            {/* Category and Content Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1.5" />
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={categoryInputRef}
                    type="text"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    onFocus={() => setShowCategorySuggestions(true)}
                    placeholder="Type or select a category"
                    className={`input-field pr-10 ${errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    required
                    autoCapitalize="words"
                    autoComplete="off"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  
                  {/* Category Suggestions Dropdown */}
                  {showCategorySuggestions && categorySuggestions.length > 0 && (
                    <div
                      ref={categoryDropdownRef}
                      className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {categorySuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleCategorySelect(suggestion)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Show message when no suggestions match */}
                  {showCategorySuggestions && category && categorySuggestions.length === 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-600">
                      Press Enter to create "<span className="font-semibold">{category}</span>"
                    </div>
                  )}
                </div>
                {errors.category && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.category}</p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  Type to search or create a new category
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1.5" />
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as Link['contentType'])}
                  className="input-field"
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1.5" />
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="research, article, example"
                className="input-field"
                autoCapitalize="none"
                autoComplete="off"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Separate tags with commas. Tags help organize and find your links.
              </p>
            </div>

            {/* Collection */}
            {collections.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Folder className="w-4 h-4 inline mr-1.5" />
                  Collection (Optional)
                </label>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="input-field"
                >
                  <option value="">None - Add to general library</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Checkboxes */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Mark as favorite</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Archive immediately</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 sm:px-6 py-4 flex items-center justify-end gap-3 shadow-lg sm:shadow-none flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] sm:min-h-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm min-h-[44px] sm:min-h-0"
            >
              Add Link
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
