import { create } from 'zustand';

type Tab = 'export' | 'formatting' | 'themes' | 'tools' | 'structure' | 'previewer' | 'versions';

interface AppState {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  // Export state
  exportFormats: string[];
  toggleExportFormat: (format: string) => void;
  trimSize: string;
  setTrimSize: (size: string) => void;
  isExporting: boolean;
  setIsExporting: (v: boolean) => void;
  lastExportUrl: string | null;
  setLastExportUrl: (url: string | null) => void;

  // Theme state
  selectedThemeId: string | null;
  setSelectedThemeId: (id: string | null) => void;

  // Writing tools
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;

  // Global
  error: string | null;
  setError: (err: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'export',
  setActiveTab: (tab) => set({ activeTab: tab }),

  exportFormats: ['epub', 'txt', 'html'],
  toggleExportFormat: (format) => set((state) => ({
    exportFormats: state.exportFormats.includes(format)
      ? state.exportFormats.filter((f) => f !== format)
      : [...state.exportFormats, format],
  })),
  trimSize: '6x9',
  setTrimSize: (size) => set({ trimSize: size }),
  isExporting: false,
  setIsExporting: (v) => set({ isExporting: v }),
  lastExportUrl: null,
  setLastExportUrl: (url) => set({ lastExportUrl: url }),

  selectedThemeId: null,
  setSelectedThemeId: (id) => set({ selectedThemeId: id }),

  dailyGoal: 1000,
  setDailyGoal: (goal) => set({ dailyGoal: goal }),

  error: null,
  setError: (err) => set({ error: err }),
}));
