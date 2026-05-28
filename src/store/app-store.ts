import { create } from "zustand";

export type SearchFilters = {
  q: string;
  listingType: "rent" | "sale" | null;
  district: string | null;
  propertyType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  amenities: string[];
};

const initial: SearchFilters = {
  q: "",
  listingType: null,
  district: null,
  propertyType: null,
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  amenities: [],
};

type AppState = {
  filters: SearchFilters;
  setFilters: (f: Partial<SearchFilters>) => void;
  resetFilters: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  filters: initial,
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: initial }),
}));
