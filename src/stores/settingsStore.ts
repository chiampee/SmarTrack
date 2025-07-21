import { create } from 'zustand';
import { Settings } from '../types/Settings';
import { settingsService } from '../services/settingsService';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  showOnboarding: boolean;
  hasSeenOnboarding: boolean;
  lastOnboardingShown?: number;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  setShowOnboarding: (show: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: null,
  loading: false,
  showOnboarding: false,
  hasSeenOnboarding: false,
  lastOnboardingShown: undefined,
  async loadSettings() {
    set({ loading: true });
    const settings = await settingsService.get();
    set({ settings, loading: false });
  },
  async saveSettings(settings) {
    await settingsService.save(settings);
    set({ settings });
  },
  setShowOnboarding: (show: boolean) => {
    set((state) => ({ 
      ...state, 
      showOnboarding: show,
      hasSeenOnboarding: show ? false : state.hasSeenOnboarding,
      lastOnboardingShown: show ? Date.now() : state.lastOnboardingShown
    }));
  },

  setHasSeenOnboarding: (seen: boolean) => {
    set((state) => ({ 
      ...state, 
      hasSeenOnboarding: seen,
      showOnboarding: seen ? false : state.showOnboarding
    }));
  },
}));
