export interface Task {
  id: string;
  boardId?: string;
  parentId?: string; // for subtasks
  name: string;
  description?: string;
  status: 'open' | 'in_progress' | 'in_flames' | 'done';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
