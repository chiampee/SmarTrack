import React from 'react'
import { Filter, X, Calendar, Tag, FileText } from 'lucide-react'
import { Link } from '../types/Link'

interface FiltersDropdownProps {
  filters: {
    category: string
    dateRange: 'today' | 'last_week' | 'last_month' | 'last_year' | 'all_time'
    tags: string[]
    contentType: Link['contentType'] | ''
  }
  onFiltersChange: (filters: any) => void
}

export const FiltersDropdown: React.FC<FiltersDropdownProps> = ({ filters, onFiltersChange }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const contentTypes: { value: Link['contentType']; label: string }[] = [
    { value: 'webpage', label: 'Web Page' },
    { value: 'pdf', label: 'PDF' },
    { value: 'article', label: 'Article' },
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image' },
    { value: 'document', label: 'Document' },
    { value: 'other', label: 'Other' },
  ]

  const dateRanges = [
    { value: 'all_time', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_year', label: 'Last Year' },
  ]

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      dateRange: 'all_time',
      tags: [],
      contentType: ''
    })
  }

  const hasActiveFilters = 
    filters.category !== '' ||
    filters.dateRange !== 'all_time' ||
    filters.tags.length > 0 ||
    filters.contentType !== ''

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-secondary flex items-center gap-2 ${
          hasActiveFilters ? 'bg-blue-100 text-blue-700 border-blue-300' : ''
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
            Active
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Filter Links</h3>
              <div className="flex gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="input-field w-full"
                >
                  {dateRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Category
                </label>
                <input
                  type="text"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  placeholder="Filter by category"
                  className="input-field w-full"
                />
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Content Type
                </label>
                <select
                  value={filters.contentType}
                  onChange={(e) => handleFilterChange('contentType', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">All Types</option>
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Enter tags (comma separated)"
                  className="input-field w-full"
                  onBlur={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    handleFilterChange('tags', tags)
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
