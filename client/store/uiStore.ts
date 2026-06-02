import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  curriculumOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCurriculumOpen: (open: boolean) => void;
  toggleCurriculum: () => void;
}

/** Ephemeral UI state: sidebar / curriculum slide-over open states. */
export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  curriculumOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCurriculumOpen: (curriculumOpen) => set({ curriculumOpen }),
  toggleCurriculum: () => set((s) => ({ curriculumOpen: !s.curriculumOpen })),
}));
