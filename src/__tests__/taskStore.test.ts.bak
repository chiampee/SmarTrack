import { expect, vi, it, beforeEach, describe } from 'vitest';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types/Task';

// ============================================================================
// TEST DATA
// ============================================================================

const sampleTasks: Task[] = [
  {
    id: 't1',
    name: 'Task A',
    priority: 'low',
    status: 'open',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 't2',
    name: 'Task B',
    priority: 'urgent',
    status: 'done',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
];

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('../services/taskService', () => ({
  taskService: {
    getAll: vi.fn(async () => sampleTasks),
  },
}));

describe('📋 Task Store', () => {
  
  // ============================================================================
  // TEST SETUP
  // ============================================================================
  
  beforeEach(() => {
    // Reset store to clean state before each test
    useTaskStore.setState({ 
      tasks: [], 
      loading: false, 
      statusFilter: undefined, 
      priorityFilter: undefined, 
      sortKey: 'createdAt' 
    });
  });

  // ============================================================================
  // FILTERING TESTS
  // ============================================================================
  
  describe('🔍 Filtering Functionality', () => {
    
    it('✅ should filter tasks by status correctly', async () => {
      // Arrange
      const store = useTaskStore.getState();
      
      // Act - Set filter first, then load tasks
      store.setStatusFilter('done');
      await store.loadTasks();
      
      // Assert
      const filteredTasks = useTaskStore.getState().tasks;
      expect(filteredTasks.length).toBe(1);
    });
  });

  // ============================================================================
  // SORTING TESTS
  // ============================================================================
  
  describe('📊 Sorting Functionality', () => {
    
    it('✅ should sort tasks by creation date correctly', async () => {
      // Arrange
      const store = useTaskStore.getState();
      await store.loadTasks();
      
      // Act
      store.setSortKey('createdAt');
      
      // Assert
      const sortedTasks = useTaskStore.getState().tasks;
      const taskIds = sortedTasks.map(t => t.id);
      expect(taskIds).toEqual(['t2', 't1']); // Newer task (t2) comes first
    });
  });
}); 