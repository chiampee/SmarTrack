import React, { useState } from 'react'
import { X, Hash } from 'lucide-react'
import { Collection } from '../types/Link'

interface CreateCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (collection: Omit<Collection, 'id' | 'userId' | 'linkCount' | 'createdAt' | 'updatedAt'>) => Promise<void> | void
}

export const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate 
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [icon, setIcon] = useState('project')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const colors = [
    { value: '#3B82F6', label: 'Blue', bg: 'bg-blue-500' },
    { value: '#8B5CF6', label: 'Purple', bg: 'bg-purple-500' },
    { value: '#10B981', label: 'Green', bg: 'bg-green-500' },
    { value: '#F59E0B', label: 'Amber', bg: 'bg-amber-500' },
    { value: '#EF4444', label: 'Red', bg: 'bg-red-500' },
    { value: '#EC4899', label: 'Pink', bg: 'bg-pink-500' },
    { value: '#06B6D4', label: 'Cyan', bg: 'bg-cyan-500' },
    { value: '#F97316', label: 'Orange', bg: 'bg-orange-500' },
  ]

  const icons = [
    { value: 'project', label: 'Project', icon: '📁' },
    { value: 'research', label: 'Research', icon: '📚' },
    { value: 'bookmark', label: 'Bookmark', icon: '🔖' },
    { value: 'folder', label: 'Folder', icon: '📂' },
    { value: 'star', label: 'Star', icon: '⭐' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate
    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    }
    if (name.trim().length > 50) {
      newErrors.name = 'Project name is too long (max 50 characters)'
    }
    if (description && description.length > 200) {
      newErrors.description = 'Description is too long (max 200 characters)'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setIsSubmitting(true)
      setErrors({})
      
      // Create collection (await if it's async)
      const result = onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
        isDefault: false,
      })
      
      // If onCreate returns a promise, wait for it
      if (result instanceof Promise) {
        await result
      }

      // Reset form only on success (if we reach here, creation succeeded)
      setName('')
      setDescription('')
      setColor('#3B82F6')
      setIcon('project')
      setErrors({})
      onClose()
    } catch (error) {
      // Display error in form
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project'
      setErrors({ 
        submit: errorMessage.includes('already exists') 
          ? 'A project with this name already exists' 
          : errorMessage 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setColor('#3B82F6')
    setIcon('project')
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Research Project, Work Notes"
                className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
                placeholder="Optional description for your project"
                rows={2}
                className={`input-field w-full resize-none ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`h-10 rounded-lg border-2 transition-all ${
                      color === c.value
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-full h-full ${c.bg} rounded-lg`}></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map((i) => (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => setIcon(i.value)}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      icon === i.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl">{i.icon}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions - Improved clickability */}
          <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

