import { expect, vi, it, beforeEach } from 'vitest';
import { useBoardStore } from '../stores/boardStore';
import { Board } from '../types/Board';

const boards: Board[] = [
  { id: 'b1', title: 'One', description: '', color: '#fff', createdAt: new Date(), updatedAt: new Date() },
  { id: 'b2', title: 'Two', description: '', color: '#000', createdAt: new Date(), updatedAt: new Date() },
];

vi.mock('../services/boardService', () => ({
  boardService: {
    getAll: vi.fn(async () => boards),
  },
}));

beforeEach(() => {
  useBoardStore.setState({ boards: [], loading: false });
});

it('loads boards', async () => {
  const st = useBoardStore.getState();
  await st.loadBoards();
  expect(useBoardStore.getState().boards.length).toBe(2);
}); 