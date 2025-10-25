import React, { useEffect, useState, useRef } from 'react';
import { useLinkStore } from '../../stores/linkStore';
import { ChevronDown, Search, Filter } from 'lucide-react';

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const container = containerRef.current;
      if (container && target && !container.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative z-50 filter-select ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          console.log('🔽 Dropdown clicked, current state:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <ul className="py-1 max-h-48 overflow-y-auto">
            {options.map((option) => (
              <li
                key={option.value}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  option.value === value
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-900'
                }`}
                onClick={() => {
                  console.log('✅ Option selected:', option.value);
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const LinkFilters: React.FC = () => {
  const {
    statusFilter,
    priorityFilter,
    sortKey,
    searchTerm,
    setStatusFilter,
    setPriorityFilter,
    setSortKey,
    setSearchTerm,
  } = useLinkStore();
  const [search, setSearch] = useState(searchTerm || '');

  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(search.trim() === '' ? '' : search);
    }, 300);
    return () => clearTimeout(id);
  }, [search, setSearchTerm]);

  return (
    <div className="flex items-center gap-3 flex-wrap relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search links..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 w-80"
        />
      </div>

      {/* Filter Icon */}
      <div className="flex items-center gap-2 text-gray-500">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Filters</span>
      </div>

      {/* Status Filter */}
      <FilterSelect
        value={statusFilter || ''}
        onChange={(value) => setStatusFilter(value === '' ? undefined : value as 'active' | 'archived' | 'deleted')}
        options={[
          { value: '', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
          { value: 'deleted', label: 'Deleted' },
        ]}
        placeholder="All Status"
        className="w-32"
      />

      {/* Priority Filter */}
      <FilterSelect
        value={priorityFilter || ''}
        onChange={(value) => setPriorityFilter(value === '' ? undefined : value as 'low' | 'medium' | 'high')}
        options={[
          { value: '', label: 'All Priority' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]}
        placeholder="All Priority"
        className="w-32"
      />

      {/* Sort Filter */}
      <FilterSelect
        value={sortKey}
        onChange={(value) => setSortKey(value as 'createdAt' | 'labels')}
        options={[
          { value: 'createdAt', label: 'Sort by Date' },
          { value: 'labels', label: 'Sort by Labels' },
        ]}
        placeholder="Sort by"
        className="w-36"
      />
    </div>
  );
};
