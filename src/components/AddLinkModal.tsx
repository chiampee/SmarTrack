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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col m-0 sm:m-2 sm:m-4">
        {/* ✅ MOBILE-OPTIMIZED: Header with better mobile styling */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Add New Link</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Save a new link to your research library</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 active:text-gray-700 hover:bg-white active:bg-gray-50 rounded-full p-2 sm:p-1 transition-colors touch-manipulation flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-6 h-6 sm:w-6" />
          </button>
        </div>

        {/* ✅ MOBILE-OPTIMIZED: Form with better mobile spacing and touch targets */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 pb-24 sm:pb-6">
            {/* URL */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-2.5">
                <LinkIcon className="w-4 h-4 sm:w-4 sm:h-4 inline mr-1.5 align-middle" />
                <span className="align-middle">URL <span className="text-red-500">*</span></span>
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className={`input-field w-full text-base sm:text-sm py-3 sm:py-2.5 px-4 rounded-lg border-2 transition-colors touch-manipulation ${errors.url ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="url"
              />
              {errors.url && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">{errors.url}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-2.5">
                <FileText className="w-4 h-4 sm:w-4 sm:h-4 inline mr-1.5 align-middle" />
                <span className="align-middle">Title <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter link title"
                className={`input-field w-full text-base sm:text-sm py-3 sm:py-2.5 px-4 rounded-lg border-2 transition-colors touch-manipulation ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                autoCapitalize="sentences"
                autoComplete="off"
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-2.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter link description"
                rows={4}
                className="input-field w-full text-base sm:text-sm py-3 sm:py-2.5 px-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none transition-colors touch-manipulation"
                autoCapitalize="sentences"
              />
            </div>

            {/* ✅ MOBILE-OPTIMIZED: Category and Content Type - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4">
              <div className="relative">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-2.5">
                  <Globe className="w-4 h-4 sm:w-4 sm:h-4 inline mr-1.5 align-middle" />
                  <span className="align-middle">Category <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <input
                    ref={categoryInputRef}
                    type="text"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    onFocus={() => setShowCategorySuggestions(true)}
                    placeholder="Type or select a category"
                    className={`input-field w-full text-base sm:text-sm py-3 sm:py-2.5 px-4 pr-10 rounded-lg border-2 transition-colors touch-manipulation ${errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                    required
                    autoCapitalize="words"
                    autoComplete="off"
                  />
                  <ChevronDown className="absolute right-3 sm:right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
                  
                  {/* ✅ MOBILE-OPTIMIZED: Category Suggestions Dropdown */}
                  {showCategorySuggestions && categorySuggestions.length > 0 && (
                    <div
                      ref={categoryDropdownRef}
                      className="absolute z-20 w-full mt-1.5 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-56 sm:max-h-48 overflow-y-auto overscroll-contain"
                    >
                      {categorySuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleCategorySelect(suggestion)}
                          className="w-full text-left px-4 py-3 sm:py-2 text-base sm:text-sm text-gray-700 active:bg-blue-50 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg touch-manipulation border-b border-gray-100 last:border-b-0"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* ✅ MOBILE-OPTIMIZED: Show message when no suggestions match */}
                  {showCategorySuggestions && category && categorySuggestions.length === 0 && (
                    <div className="absolute z-20 w-full mt-1.5 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-4 sm:p-3 text-sm sm:text-sm text-gray-600">
                      Press Enter to create "<span className="font-semibold">{category}</span>"
                    </div>
                  )}
                </div>
                {errors.category && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">{errors.category}</p>
                )}
                <p className="mt-1.5 text-xs sm:text-xs text-gray-500">
                  Type to search or create a new category
                </p>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-2.5">
                  <FileText className="w-4 h-4 sm:w-4 sm:h-4 inline mr-1.5 align-middle" />
                  <span className="align-middle">Content Type</span>
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as Link['contentType'])}
                  className="input-field w-full text-base sm:text-sm py-3 sm:py-2.5 px-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors touch-manipulation appearance-none bg-white"
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ✅ MOBILE-OPTIMIZED: Tags with better mobile UX */}
            <div>
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-2.5">
                <Tag className="w-4 h-4 sm:w-4 sm:h-4 inline mr-1.5 align-middle" />
                <span className="align-middle">Tags</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="research, article, example"
                className="input-field w-full text-base sm:text-sm py-3 sm:py-2.5 px-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors touch-manipulation"
                autoCapitalize="none"
                autoComplete="off"
              />
              <p className="mt-1.5 text-xs sm:text-xs text-gray-500 flex items-start gap-1.5">
                <span className="mt-0.5">💡</span>
                <span>Separate tags with commas. Tags help organize and find your links.</span>
              </p>
            </div>

            {/* Collection */}
            {collections.length > 0 && (
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-2.5">
                  <Folder className="w-4 h-4 sm:w-4 sm:h-4 inline mr-1.5 align-middle" />
                  <span className="align-middle">Collection (Optional)</span>
                </label>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="input-field w-full text-base sm:text-sm py-3 sm:py-2.5 px-4 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors touch-manipulation appearance-none bg-white"
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

            {/* ✅ MOBILE-OPTIMIZED: Checkboxes with better touch targets */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
              <label className="flex items-center gap-3 cursor-pointer touch-manipulation active:opacity-70">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-5 h-5 sm:w-4 sm:h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm sm:text-sm font-medium text-gray-700 select-none">Mark as favorite</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer touch-manipulation active:opacity-70">
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  className="w-5 h-5 sm:w-4 sm:h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm sm:text-sm font-medium text-gray-700 select-none">Archive immediately</span>
              </label>
            </div>
          </div>

          {/* ✅ MOBILE-OPTIMIZED: Fixed bottom action bar for mobile */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-end gap-3 sm:gap-3 shadow-lg sm:shadow-none flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 sm:px-4 py-3 sm:py-2 text-base sm:text-sm font-semibold sm:font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl sm:rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation min-h-[48px] sm:min-h-0 flex-1 sm:flex-initial"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 sm:px-4 py-3 sm:py-2 text-base sm:text-sm font-semibold sm:font-medium text-white bg-blue-600 rounded-xl sm:rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg sm:shadow-sm touch-manipulation min-h-[48px] sm:min-h-0 flex-1 sm:flex-initial"
            >
              Add Link
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
