import React, { useEffect, useState } from 'react';
import { useLinkStore } from '../../stores/linkStore';
import { Input, Select } from '..';

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
      <Select
        value={statusFilter || ''}
        onChange={(e) =>
          setStatusFilter(
            e.target.value as 'active' | 'archived' | 'deleted' | undefined
          )
        }
        className="w-32"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
        <option value="deleted">Deleted</option>
      </Select>
      <Select
        value={priorityFilter || ''}
        onChange={(e) =>
          setPriorityFilter(
            e.target.value as 'low' | 'medium' | 'high' | undefined
          )
        }
        className="w-32"
      >
        <option value="">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </Select>
      <Select
        value={sortKey}
        onChange={(e) =>
          setSortKey(
            e.target.value as 'createdAt' | 'priority' | 'title' | 'labels'
          )
        }
        className="w-32"
      >
        <option value="createdAt">Date</option>
        <option value="priority">Priority</option>
        <option value="title">Title</option>
        <option value="labels">Labels</option>
        <option value="status">Status</option>
      </Select>
    </div>
  );
};
