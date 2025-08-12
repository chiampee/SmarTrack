import { expect, vi, it, beforeEach, describe } from 'vitest';
import { useLinkStore } from '../stores/linkStore';
import { Link } from '../types/Link';

// ============================================================================
// TEST DATA
// ============================================================================

const sampleLinks: Link[] = [
  {
    id: '1',
    url: 'https://a.com',
    metadata: { title: 'Alpha', description: '', image: '' },
    labels: ['news'],
    priority: 'low',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: '2',
    url: 'https://b.com',
    metadata: { title: 'Beta', description: '', image: '' },
    labels: ['work'],
    priority: 'high',
    status: 'archived',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
];

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('../services/linkService', () => ({
  linkService: {
    getAll: vi.fn(async () => sampleLinks),
  },
}));

describe('🔗 Link Store', () => {
  
  // ============================================================================
  // TEST SETUP
  // ============================================================================
  
  beforeEach(() => {
    // Reset store to clean state before each test
    useLinkStore.setState({ 
      links: [], 
      rawLinks: [],
      loading: false, 
      statusFilter: undefined, 
      priorityFilter: undefined, 
      searchTerm: undefined, 
      sortKey: 'createdAt',
      sortDir: 'asc'
    });
  });

  // ============================================================================
  // FILTERING TESTS
  // ============================================================================
  
  describe('🔍 Filtering Functionality', () => {
    
    it('✅ should filter links by status correctly', async () => {
      // Arrange
      const store = useLinkStore.getState();
      await store.fetchLinks(); // Load data first
      
      // Act
      store.setStatusFilter('active');
      
      // Assert
      const filteredLinks = useLinkStore.getState().links;
      expect(filteredLinks.length).toBe(1);
      expect(filteredLinks[0].id).toBe('1');
    });

    it('✅ should filter links by priority correctly', async () => {
      // Arrange
      const store = useLinkStore.getState();
      await store.fetchLinks(); // Load data first
      
      // Act
      store.setPriorityFilter('high');
      
      // Assert
      const filteredLinks = useLinkStore.getState().links;
      expect(filteredLinks.length).toBe(1);
      expect(filteredLinks[0].id).toBe('2');
    });

    it('✅ should filter links by search term in title', async () => {
      // Arrange
      const store = useLinkStore.getState();
      await store.fetchLinks(); // Load data first
      
      // Act
      store.setSearchTerm('Beta');
      
      // Assert
      const filteredLinks = useLinkStore.getState().links;
      expect(filteredLinks.length).toBe(1);
      expect(filteredLinks[0].id).toBe('2');
    });
  });

  // ============================================================================
  // SORTING TESTS
  // ============================================================================
  
  describe('📊 Sorting Functionality', () => {
    
    it('✅ should sort links by labels in ascending order', async () => {
      // Arrange
      const store = useLinkStore.getState();
      await store.fetchLinks(); // Load data first
      
      // Act
      store.setSortKey('labels');
      
      // Assert
      const sortedLinks = useLinkStore.getState().links;
      const linkIds = sortedLinks.map((l) => l.id);
      expect(linkIds).toEqual(['1', '2']); // 'news' comes before 'work' alphabetically
    });
  });
}); 