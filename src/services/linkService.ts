import { db } from '../db/smartResearchDB';
import { Link } from '../types/Link';

export const linkService = {
  async getAll() {
    return db.links.toArray();
  },
  async getById(id: string) {
    return db.getLink(id);
  },
  async create(link: Link) {
    link.createdAt = new Date();
    link.updatedAt = new Date();
    return db.addLink(link);
  },
  async update(id: string, changes: Partial<Link>) {
    changes.updatedAt = new Date();
    return db.updateLink(id, changes);
  },
  async remove(id: string) {
    return db.deleteLink(id);
  },
  async filterByStatus(status: Link['status']) {
    return db.links.where('status').equals(status).toArray();
  },
  async filterByPriority(priority: Link['priority']) {
    return db.links.where('priority').equals(priority).toArray();
  },
};
