import { db } from '../db/smartResearchDB';
import { Task } from '../types/Task';

export const taskService = {
  async getAll() {
    return db.tasks.toArray();
  },
  async getById(id: string) {
    return db.getTask(id);
  },
  async create(task: Task) {
    task.createdAt = new Date();
    task.updatedAt = new Date();
    return db.addTask(task);
  },
  async update(id: string, changes: Partial<Task>) {
    changes.updatedAt = new Date();
    return db.updateTask(id, changes);
  },
  async remove(id: string) {
    return db.deleteTask(id);
  },
  async filterByStatus(status: Task['status']) {
    return db.tasks.where('status').equals(status).toArray();
  },
  async filterByPriority(priority: Task['priority']) {
    return db.tasks.where('priority').equals(priority).toArray();
  },
};
