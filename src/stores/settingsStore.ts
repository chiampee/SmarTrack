import { create } from 'zustand';
import { Settings } from '../types/Settings';
import { settingsService } from '../services/settingsService';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: null,
  loading: false,
  async loadSettings() {
    set({ loading: true });
    const settings = await settingsService.get();
    set({ settings, loading: false });
  },
  async saveSettings(settings) {
    await settingsService.save(settings);
    set({ settings });
  },
})); 