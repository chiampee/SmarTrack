import React, { useEffect, useState } from 'react';
import { useLinkStore } from '../../stores/linkStore';
import { Input } from '..';
import { ChevronDown, GripVertical } from 'lucide-react';

interface DraggableFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}

const DraggableFilter: React.FC<DraggableFilterProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [orderedOptions, setOrderedOptions] = useState(options);

  // Load custom order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(`filterOrder_${placeholder}`);
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        const reordered = order.map((val: string) => 
          options.find(opt => opt.value === val)
        ).filter(Boolean);
        const remaining = options.filter(opt => !order.includes(opt.value));
        setOrderedOptions([...reordered, ...remaining]);
      } catch {
        setOrderedOptions(options);
      }
    } else {
      setOrderedOptions(options);
    }
  }, [options, placeholder]);

  const onDragStart = (e: React.DragEvent<HTMLLIElement>, optionValue: string) => {
    e.dataTransfer.setData('text/plain', optionValue);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e: React.DragEvent<HTMLLIElement>, targetValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceValue = e.dataTransfer.getData('text/plain');
    if (sourceValue && sourceValue !== targetValue) {
      setOrderedOptions(prev => {
        const newOrder = [...prev];
        const fromIdx = newOrder.findIndex(opt => opt.value === sourceValue);
        const toIdx = newOrder.findIndex(opt => opt.value === targetValue);
        if (fromIdx === -1 || toIdx === -1) return prev;
        
        const [movedItem] = newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, movedItem);
        
        // Save the new order to localStorage
        const orderValues = newOrder.map(opt => opt.value);
        localStorage.setItem(`filterOrder_${placeholder}`, JSON.stringify(orderValues));
        
        return newOrder;
      });
    }
    setDragOverItem(null);
  };

  const selectedOption = orderedOptions.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center gap-2">
          <GripVertical 
            size={12} 
            className="text-gray-400 opacity-50 hover:opacity-100 transition-opacity duration-200" 
          />
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
            Drag to reorder options
          </div>
          <ul className="py-1 max-h-60 overflow-auto">
            {orderedOptions.map((option) => (
              <li
                key={option.value}
                className={`flex items-center px-3 py-2 text-sm cursor-pointer transition-colors ${
                  dragOverItem === option.value
                    ? 'bg-blue-100 border-blue-300'
                    : option.value === value
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-100 text-gray-900'
                }`}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStart(e, option.value);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDragOver(e);
                  setDragOverItem(option.value);
                }}
                onDrop={(e) => onDrop(e, option.value)}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOverItem(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <GripVertical 
                  size={14} 
                  className="text-gray-400 mr-2 cursor-move hover:text-gray-600" 
                  onMouseDown={(e) => e.stopPropagation()}
                />
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
    const id = setTimeout(() => setSearchTerm(search), 300);
    return () => clearTimeout(id);
  }, [search, setSearchTerm]);

  return (
    <div className="flex flex-wrap gap-3 bg-gray-50/90 backdrop-blur px-4 py-3 sticky top-12 z-30 border-b border-gray-200 shadow-sm">
      <Input
        placeholder="Search title or URL..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-48"
        id="searchInput"
      />
      <DraggableFilter
        value={statusFilter || ''}
        onChange={(value) => setStatusFilter(value as 'active' | 'archived' | 'deleted' | undefined)}
        options={[
          { value: '', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
          { value: 'deleted', label: 'Deleted' },
        ]}
        placeholder="All Status"
        className="w-32"
      />
      <DraggableFilter
        value={priorityFilter || ''}
        onChange={(value) => setPriorityFilter(value as 'low' | 'medium' | 'high' | undefined)}
        options={[
          { value: '', label: 'All Priority' },
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]}
        placeholder="All Priority"
        className="w-32"
      />
      <DraggableFilter
        value={sortKey}
        onChange={(value) => setSortKey(value as 'createdAt' | 'labels')}
        options={[
          { value: 'createdAt', label: 'Date' },
          { value: 'labels', label: 'Labels' },
        ]}
        placeholder="Sort by"
        className="w-32"
      />
    </div>
  );
};
