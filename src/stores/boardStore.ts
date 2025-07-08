import { create } from 'zustand';
import { Board } from '../types/Board';
import { boardService } from '../services/boardService';

interface BoardState {
  boards: Board[];
  loading: boolean;
  error?: string;
  loadBoards: () => Promise<void>;
  addBoard: (board: Board) => Promise<void>;
  updateBoard: (id: string, changes: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>()((set) => ({
  boards: [],
  loading: false,
  async loadBoards() {
    try {
      set({ loading: true });
      const boards = await boardService.getAll();
      set({ boards, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  async addBoard(board) {
    await boardService.create(board);
    await this.loadBoards();
  },
  async updateBoard(id, changes) {
    await boardService.update(id, changes);
    await this.loadBoards();
  },
  async deleteBoard(id) {
    await boardService.remove(id);
    await this.loadBoards();
  },
})); 