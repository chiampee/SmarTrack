import React, { useState, useEffect, useRef } from 'react'
import { Search, Tag, FileText, Sparkles } from 'lucide-react'
import { Link } from '../types/Link'

interface SearchSuggestion {
  type: 'recent' | 'tag' | 'title' | 'url'
  text: string
  icon: React.ReactNode
}

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  links: Link[]
  onSelect?: (suggestion: SearchSuggestion) => void
  placeholder?: string
  className?: string
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  links,
  onSelect,
  placeholder = 'Search your research library...',
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate suggestions based on query
  useEffect(() => {
    if (!value.trim()) {
      setIsOpen(false)
      setSuggestions([])
      return
    }

    const query = value.toLowerCase()
    const newSuggestions: SearchSuggestion[] = []

    // Search in titles
    const matchingTitles = links
      .filter(link => link.title.toLowerCase().includes(query))
      .slice(0, 3)
      .map(link => ({
        type: 'title' as const,
        text: link.title,
        icon: <FileText className="w-4 h-4" />
      }))

    newSuggestions.push(...matchingTitles)

    // Search in tags
    const allTags = new Set<string>()
    links.forEach(link => {
      link.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query) || query.includes(tag.toLowerCase())) {
          allTags.add(tag)
        }
      })
    })

    const matchingTags = Array.from(allTags)
      .slice(0, 3)
      .map(tag => ({
        type: 'tag' as const,
        text: `#${tag}`,
        icon: <Tag className="w-4 h-4" />
      }))

    newSuggestions.push(...matchingTags)

    // Search in URLs
    const matchingUrls = links
      .filter(link => link.url.toLowerCase().includes(query))
      .slice(0, 2)
      .map(link => ({
        type: 'url' as const,
        text: link.url,
        icon: <Search className="w-4 h-4" />
      }))

    newSuggestions.push(...matchingUrls)

    setSuggestions(newSuggestions.slice(0, 8))
    setIsOpen(newSuggestions.length > 0)
    setSelectedIndex(-1)
  }, [value, links])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    let searchText = suggestion.text

    // Remove # from tags
    if (suggestion.type === 'tag') {
      searchText = suggestion.text.substring(1)
    }

    onChange(searchText)
    setIsOpen(false)
    onSelect?.(suggestion)
    inputRef.current?.focus()
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="font-semibold text-blue-600">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  const getSuggestionLabel = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'recent':
        return 'Recent'
      case 'title':
        return 'Title match'
      case 'tag':
        return 'Tag'
      case 'url':
        return 'URL match'
      default:
        return ''
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-4 pr-16 h-10 sm:h-9 text-base sm:text-sm w-full rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100/50 sm:bg-white sm:border sm:border-gray-200 focus:border-blue-500"
        />
        {value && (
          <button
            onClick={() => {
              onChange('')
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm z-10"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${index}`}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all ${
                  selectedIndex === index
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`flex-shrink-0 mt-1 ${selectedIndex === index ? 'text-blue-600' : 'text-gray-400'}`}>
                  {suggestion.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                    {getSuggestionLabel(suggestion)}
                  </div>
                  <div className="text-sm font-medium truncate">
                    {highlightMatch(suggestion.text, value)}
                  </div>
                </div>
                {suggestion.type === 'tag' && (
                  <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Use ↑↓ to navigate, Enter to select
          </div>
        </div>
      )}
    </div>
  )
}


