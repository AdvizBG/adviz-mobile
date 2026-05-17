import { create } from 'zustand';
import type { MentorListParams } from '../lib/types';

interface FilterState {
  filters: MentorListParams;
  setFilters: (filters: Partial<MentorListParams>) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>()((set) => ({
  filters: {},
  setFilters: (partial) =>
    set((s) => ({ filters: { ...s.filters, ...partial } })),
  clearFilters: () => set({ filters: {} }),
}));
