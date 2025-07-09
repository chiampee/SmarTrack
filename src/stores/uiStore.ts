import { create } from 'zustand';

type ModalType = 'none' | 'board' | 'link' | 'settings';

interface UIState {
  isSidebarOpen: boolean;
  modal: ModalType;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isSidebarOpen: true,
  modal: 'none',
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  openModal: (type) => set({ modal: type }),
  closeModal: () => set({ modal: 'none' }),
}));
