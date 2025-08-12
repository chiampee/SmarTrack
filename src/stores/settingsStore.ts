import { create } from 'zustand';
import { Settings } from '../types/Settings';
import { settingsService } from '../services/settingsService';

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  showOnboarding: boolean;
  hasSeenOnboarding: boolean;
  lastOnboardingShown?: number;
  // User API key management
  userApiKey: string | null;
  useUserKey: boolean;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Settings) => Promise<void>;
  setShowOnboarding: (show: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setDontShowOnboarding: (dontShow: boolean) => void;
  resetOnboarding: () => void;
  // User API key methods
  setUserApiKey: (key: string | null) => void;
  setUseUserKey: (use: boolean) => void;
  toggleUseUserKey: () => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: null,
  loading: false,
  showOnboarding: false,
  hasSeenOnboarding: localStorage.getItem('hasSeenOnboarding') === 'true',
  lastOnboardingShown: undefined,
  // User API key state
  userApiKey: localStorage.getItem('userApiKey'),
  useUserKey: localStorage.getItem('useUserKey') === 'true',
  
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
    // Check if user has chosen not to show onboarding again
    const dontShowAgain = localStorage.getItem('dontShowOnboarding') === 'true';
    if (dontShowAgain && show) {
      return; // Don't show if user has opted out
    }
    
    set((state) => ({ 
      ...state, 
      showOnboarding: show,
      hasSeenOnboarding: show ? false : state.hasSeenOnboarding,
      lastOnboardingShown: show ? Date.now() : state.lastOnboardingShown
    }));
  },

  setHasSeenOnboarding: (seen: boolean) => {
    if (seen) {
      localStorage.setItem('hasSeenOnboarding', 'true');
    } else {
      localStorage.removeItem('hasSeenOnboarding');
    }
    
    set((state) => ({ 
      ...state, 
      hasSeenOnboarding: seen,
      showOnboarding: seen ? false : state.showOnboarding
    }));
  },

  setDontShowOnboarding: (dontShow: boolean) => {
    if (dontShow) {
      localStorage.setItem('dontShowOnboarding', 'true');
      localStorage.setItem('hasSeenOnboarding', 'true');
    } else {
      localStorage.removeItem('dontShowOnboarding');
    }
    
    set((state) => ({ 
      ...state, 
      hasSeenOnboarding: true,
      showOnboarding: false
    }));
  },

  // Reset onboarding state (for testing purposes)
  resetOnboarding: () => {
    localStorage.removeItem('hasSeenOnboarding');
    localStorage.removeItem('dontShowOnboarding');
    set((state) => ({ 
      ...state, 
      hasSeenOnboarding: false,
      showOnboarding: false
    }));
  },

  // User API key management
  setUserApiKey: (key: string | null) => {
    if (key) {
      localStorage.setItem('userApiKey', key);
    } else {
      localStorage.removeItem('userApiKey');
    }
    set({ userApiKey: key });
  },

  setUseUserKey: (use: boolean) => {
    localStorage.setItem('useUserKey', use.toString());
    set({ useUserKey: use });
  },

  toggleUseUserKey: () => {
    const current = get().useUserKey;
    get().setUseUserKey(!current);
  },
}));
