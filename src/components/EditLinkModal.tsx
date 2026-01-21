import React, { useState, useEffect, useRef } from 'react'
import { X, Link as LinkIcon, Tag, FileText, Globe, Folder, ChevronDown } from 'lucide-react'
import { Link, Collection } from '../types/Link'
import { autoCapitalizeCategoryInput, capitalizeCategoryName } from '../utils/categoryUtils'

interface EditLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (linkId: string, updates: Partial<Link>) => void
  link: Link | null
  collections?: Collection[]
  existingCategories?: string[] // ✅ NEW: Pass existing categories for suggestions
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  link, 
  collections = [],
  existingCategories = []
}) => {
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

  // Update form when link changes
  useEffect(() => {
    if (link) {
      setTitle(link.title)
      setDescription(link.description || '')
      // ✅ FIXED: Set category directly (no "Other" workaround)
      setCategory(link.category || '')
      setCollectionId(link.collectionId || '')
      setTags(link.tags.join(', '))
      setContentType(link.contentType)
      setIsFavorite(link.isFavorite)
      setIsArchived(link.isArchived)
      setErrors({})
    }
  }, [link])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate
    const newErrors: Record<string, string> = {}
    if (!title) {
      newErrors.title = 'Title is required'
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

    // Create updates object
    // ✅ FIX: Use null instead of undefined for collectionId to properly remove from collection
    const updates: Partial<Link> = {
      title,
      description: description || undefined,
      category: finalCategory,
      tags: tagsArray,
      contentType,
      isFavorite,
      isArchived,
      collectionId: collectionId || null,  // null = remove from collection
    }

    if (link) {
      onSave(link.id, updates)
    }

    onClose()
  }

  // ✅ NEW: Handle category selection from suggestions
  const handleCategorySelect = (selectedCategory: string) => {
    const capitalized = capitalizeCategoryName(selectedCategory)
    setCategory(capitalized)
    setShowCategorySuggestions(false)
    categoryInputRef.current?.focus()
  }

  // ✅ NEW: Handle category input change
  const handleCategoryChange = (value: string) => {
    const capitalized = autoCapitalizeCategoryInput(value)
    setCategory(capitalized)
    setShowCategorySuggestions(true)
  }

  const handleClose = () => {
    setErrors({})
    onClose()
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

  if (!isOpen || !link) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col m-2 sm:m-0">
        {/* ✅ ENHANCED: Header with better styling */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Link</h2>
            <p className="text-sm text-gray-500 mt-1">Update link details and metadata</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ✅ ENHANCED: Form with better spacing */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-5">
            {/* URL (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                URL
              </label>
              <input
                type="text"
                value={link.url}
                disabled
                className="input-field w-full bg-gray-50"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter link title"
                className={`input-field w-full ${errors.title ? 'border-red-500' : ''}`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
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
                className="input-field w-full resize-none"
              />
            </div>

            {/* ✅ ENHANCED: Category and Content Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Category
                </label>
                <div className="relative">
                  <input
                    ref={categoryInputRef}
                    type="text"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    onFocus={() => setShowCategorySuggestions(true)}
                    placeholder="Type or select a category"
                    className="input-field w-full pr-10"
                    list="category-suggestions"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  
                  {/* ✅ NEW: Category Suggestions Dropdown */}
                  {showCategorySuggestions && categorySuggestions.length > 0 && (
                    <div
                      ref={categoryDropdownRef}
                      className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                      {categorySuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleCategorySelect(suggestion)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                          {capitalizeCategoryName(suggestion)}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* ✅ NEW: Show message when no suggestions match */}
                  {showCategorySuggestions && category && categorySuggestions.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                      Press Enter to create "{category}"
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Type to search or create a new category
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as Link['contentType'])}
                  className="input-field w-full"
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ✅ ENHANCED: Tags with better UX */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="research, article, example"
                className="input-field w-full"
              />
              <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                <span>💡</span>
                <span>Separate tags with commas. Tags help organize and find your links.</span>
              </p>
            </div>

            {/* Project/Collection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
                Project
              </label>
              {collections.length > 0 ? (
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="input-field w-full text-base sm:text-sm py-3 sm:py-3"
                >
                  <option value="">None - Remove from project</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="input-field w-full bg-gray-50 text-gray-500 py-3 px-4 rounded-lg border border-gray-200 text-sm sm:text-sm">
                  <p>No projects yet. Create one from the sidebar to organize your links.</p>
                </div>
              )}
            </div>

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Mark as favorite</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Archive immediately</span>
              </label>
            </div>
          </div>

          {/* ✅ ENHANCED: Actions with better styling */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
