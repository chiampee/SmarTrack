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
  iconOnly?: boolean
}

export const FiltersDropdown: React.FC<FiltersDropdownProps> = ({ filters, onFiltersChange, iconOnly = false }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; right: number } | null>(null)

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

  // Calculate dropdown position when opening - improved UX positioning
  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const dropdownWidth = 320 // w-80 = 320px
      const dropdownHeight = 400 // Estimated height
      const spacing = 8
      
      // Calculate right position - align to right edge of button
      let rightPosition = viewportWidth - rect.right
      
      // Ensure dropdown doesn't go off-screen on the right
      if (rightPosition + dropdownWidth > viewportWidth) {
        rightPosition = Math.max(16, viewportWidth - dropdownWidth - 16) // 16px margin from edge
      }
      
      // Calculate top position - prefer below button, but above if not enough space
      let topPosition = rect.bottom + window.scrollY + spacing
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      // If not enough space below but enough above, position above button
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        topPosition = rect.top + window.scrollY - dropdownHeight - spacing
      }
      
      // Ensure dropdown doesn't go off-screen at the top
      if (topPosition < window.scrollY + 16) {
        topPosition = window.scrollY + 16
      }
      
      setDropdownPosition({
        top: topPosition,
        right: rightPosition
      })
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={iconOnly 
          ? `p-1.5 rounded-md transition-colors hover:bg-gray-100 ${
              hasActiveFilters ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600'
            }`
          : `btn btn-secondary flex items-center gap-2 ${
              hasActiveFilters ? 'bg-blue-100 text-blue-700 border-blue-300' : ''
            }`
        }
        aria-label="Filter links"
        title="Filters"
      >
        <Filter className="w-4 h-4" />
        {!iconOnly && (
          <>
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                Active
              </span>
            )}
          </>
        )}
        {iconOnly && hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
        )}
      </button>

      {isOpen && dropdownPosition && (
        <>
          {/* Backdrop to ensure dropdown is on top */}
          <div 
            className="fixed inset-0 z-[9998] bg-black/5" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div 
            className="fixed w-80 sm:w-96 bg-white border border-gray-200/80 rounded-xl sm:rounded-2xl shadow-2xl shadow-gray-900/10 z-[9999] backdrop-blur-sm"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              maxHeight: 'calc(100vh - ' + (dropdownPosition.top - window.scrollY + 20) + 'px)',
              overflowY: 'auto'
            }}
          >
            <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-5 sm:mb-6 pb-3 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Filter Links
              </h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-5">
              {/* Date Range */}
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400"
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
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  Category
                </label>
                <input
                  type="text"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  placeholder="Filter by category"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 placeholder:text-gray-400"
                />
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  Content Type
                </label>
                <select
                  value={filters.contentType}
                  onChange={(e) => handleFilterChange('contentType', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400"
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
                <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2.5 flex items-center gap-2">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Enter tags (comma separated)"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 placeholder:text-gray-400"
                  onBlur={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    handleFilterChange('tags', tags)
                  }}
                />
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
