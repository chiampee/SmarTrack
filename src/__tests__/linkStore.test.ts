import { expect, vi, it, beforeEach } from 'vitest';
import { useLinkStore } from '../stores/linkStore';
import { Link } from '../types/Link';

// Sample data
const sample: Link[] = [
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

vi.mock('../services/linkService', () => ({
  linkService: {
    getAll: vi.fn(async () => sample),
  },
}));

beforeEach(() => {
  // reset store
  useLinkStore.setState({ links: [], loading: false, statusFilter: undefined, priorityFilter: undefined, searchTerm: undefined, sortKey: 'createdAt' });
});

it('filters by status', async () => {
  const store = useLinkStore.getState();
  store.setStatusFilter('active');
  await new Promise((r) => setTimeout(r, 10));
  expect(useLinkStore.getState().links.length).toBe(1);
  expect(useLinkStore.getState().links[0].id).toBe('1');
});

it('search term filters title', async () => {
  const store = useLinkStore.getState();
  store.setSearchTerm('Beta');
  await new Promise((r) => setTimeout(r, 10));
  expect(useLinkStore.getState().links.length).toBe(1);
  expect(useLinkStore.getState().links[0].id).toBe('2');
});

it('filters by priority', async () => {
  const store = useLinkStore.getState();
  store.setPriorityFilter('high');
  await new Promise((r) => setTimeout(r, 10));
  expect(useLinkStore.getState().links.length).toBe(1);
  expect(useLinkStore.getState().links[0].id).toBe('2');
});

it('sorts by title asc', async () => {
  const store = useLinkStore.getState();
  store.setSortKey('title');
  await new Promise((r) => setTimeout(r, 10));
  const ids = useLinkStore.getState().links.map((l) => l.id);
  expect(ids).toEqual(['1', '2']);
}); 