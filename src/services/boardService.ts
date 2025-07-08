import { db } from '../db/smartResearchDB';
import { Board } from '../types/Board';

export const boardService = {
  async getAll() {
    return db.boards.toArray();
  },
  async getById(id: string) {
    return db.getBoard(id);
  },
  async create(board: Board) {
    board.createdAt = new Date();
    board.updatedAt = new Date();
    return db.addBoard(board);
  },
  async update(id: string, changes: Partial<Board>) {
    changes.updatedAt = new Date();
    return db.updateBoard(id, changes);
  },
  async remove(id: string) {
    return db.deleteBoard(id);
  },
}; 