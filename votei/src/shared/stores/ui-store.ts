import { create } from 'zustand';

/**
 * App-wide client UI state (sidebar, theme, layout density).
 *
 * Lives in `shared/` because it is cross-cutting client state consumed by
 * multiple `features/` — not owned by any single feature. Framework-agnostic
 * client state only; no business logic (that belongs in `core/`).
 */

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: Theme;
  compactMode: boolean;

  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setCompactMode: (compact: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'system',
  compactMode: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setCompactMode: (compact) => set({ compactMode: compact }),
}));
