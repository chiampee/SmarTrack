import { expect, vi, it, beforeEach, describe } from 'vitest';
import { useBoardStore } from '../stores/boardStore';
import { Board } from '../types/Board';

// ============================================================================
// TEST DATA
// ============================================================================

const sampleBoards: Board[] = [
  { 
    id: 'b1', 
    title: 'One', 
    description: '', 
    color: '#fff', 
    createdAt: new Date(), 
    updatedAt: new Date() 
  },
  { 
    id: 'b2', 
    title: 'Two', 
    description: '', 
    color: '#000', 
    createdAt: new Date(), 
    updatedAt: new Date() 
  },
];

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('../services/boardService', () => ({
  boardService: {
    getAll: vi.fn(async () => sampleBoards),
  },
}));

describe('📋 Board Store', () => {
  
  // ============================================================================
  // TEST SETUP
  // ============================================================================
  
  beforeEach(() => {
    // Reset store to clean state before each test
    useBoardStore.setState({ boards: [], loading: false });
  });

  // ============================================================================
  // LOADING TESTS
  // ============================================================================
  
  describe('📥 Loading Functionality', () => {
    
    it('✅ should load boards successfully', async () => {
      // Arrange
      const store = useBoardStore.getState();
      
      // Act
      await store.loadBoards();
      
      // Assert
      const loadedBoards = useBoardStore.getState().boards;
      expect(loadedBoards.length).toBe(2);
    });
  });
}); 