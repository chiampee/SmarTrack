import React, { useState, useEffect } from 'react'
import { X, Link as LinkIcon, Tag, FileText, Globe, Folder } from 'lucide-react'
import { Link, Collection } from '../types/Link'

interface EditLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (linkId: string, updates: Partial<Link>) => void
  link: Link | null
  collections?: Collection[]
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({ isOpen, onClose, onSave, link, collections = [] }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [collectionId, setCollectionId] = useState<string>('')
  const [tags, setTags] = useState('')
  const [contentType, setContentType] = useState<Link['contentType']>('webpage')
  const [isFavorite, setIsFavorite] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form when link changes
  useEffect(() => {
    if (link) {
      setTitle(link.title)
      setDescription(link.description || '')
      
      // Check if category is in predefined list, otherwise set to "Other"
      const predefinedCategories = ['Research', 'Articles', 'Tools', 'References', 'Tutorials']
      if (predefinedCategories.includes(link.category)) {
        setCategory(link.category)
        setCustomCategory('')
      } else {
        setCategory('Other')
        setCustomCategory(link.category)
      }
      
      setCollectionId(link.collectionId || '')
      setTags(link.tags.join(', '))
      setContentType(link.contentType)
      setIsFavorite(link.isFavorite)
      setIsArchived(link.isArchived)
      setErrors({})
    }
  }, [link])

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

    // Use custom category if "Other" is selected
    const finalCategory = category === 'Other' ? customCategory.trim() : category

    // Create updates object
    const updates: Partial<Link> = {
      title,
      description: description || undefined,
      category: finalCategory,
      tags: tagsArray,
      contentType,
      isFavorite,
      isArchived,
      collectionId: collectionId || undefined,
    }

    if (link) {
      onSave(link.id, updates)
    }

    onClose()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Link</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
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

            {/* Category and Content Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Select a category</option>
                  <option value="Research">Research</option>
                  <option value="Articles">Articles</option>
                  <option value="Tools">Tools</option>
                  <option value="References">References</option>
                  <option value="Tutorials">Tutorials</option>
                  <option value="Other">Other</option>
                </select>
                
                {/* Custom Category Input */}
                {category === 'Other' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter your category name"
                      className="input-field w-full"
                    />
                  </div>
                )}
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

            {/* Tags */}
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
              <p className="mt-1 text-sm text-gray-500">
                Separate tags with commas
              </p>
            </div>

            {/* Collection */}
            {collections.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Folder className="w-4 h-4 inline mr-1" />
                  Collection
                </label>
                <select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">None - Remove from collection</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
