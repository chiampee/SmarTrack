import { db } from '../db/smartResearchDB';
import { Settings } from '../types/Settings';

export const settingsService = {
  async get() {
    return (await db.getSettings()) || null;
  },
  async save(settings: Settings) {
    settings.updatedAt = new Date();
    if (!settings.createdAt) settings.createdAt = new Date();
    return db.upsertSettings(settings);
  },
};
