import { create } from "zustand";
import type { Currency } from "@/lib/constants";

export type SearchFilters = {
  q: string;
  listingType: "rent" | "sale" | null;
  district: string | null;
  propertyType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  amenities: string[];
  stay: "short" | "medium" | "long" | null;
  availableBy: string | null;
  verifiedOnly: boolean;
  utilitiesIncluded: boolean;
  englishLease: boolean;
  sort: "newest" | "price_asc" | "price_desc";
};

export const EMPTY_FILTERS: SearchFilters = {
  q: "",
  listingType: null,
  district: null,
  propertyType: null,
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  amenities: [],
  stay: null,
  availableBy: null,
  verifiedOnly: false,
  utilitiesIncluded: false,
  englishLease: false,
  sort: "newest",
};

const CURRENCY_KEY = "homelink_currency";
const COMPARE_KEY = "homelink_compare";
export const MAX_COMPARE = 3;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

type AppState = {
  currency: Currency;
  compare: string[];
  setCurrency: (c: Currency) => void;
  toggleCompare: (id: string) => boolean;
  clearCompare: () => void;
  hydrate: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  currency: "RWF",
  compare: [],
  setCurrency: (currency) => {
    write(CURRENCY_KEY, currency);
    set({ currency });
  },
  toggleCompare: (id) => {
    const { compare } = get();
    if (!compare.includes(id) && compare.length >= MAX_COMPARE) return false;
    const next = compare.includes(id) ? compare.filter((x) => x !== id) : [...compare, id];
    write(COMPARE_KEY, JSON.stringify(next));
    set({ compare: next });
    return true;
  },
  clearCompare: () => {
    write(COMPARE_KEY, "[]");
    set({ compare: [] });
  },
  hydrate: () => {
    const currency = read(CURRENCY_KEY) as Currency | null;
    let compare: string[] = [];
    try {
      compare = JSON.parse(read(COMPARE_KEY) ?? "[]");
    } catch {
      /* keep empty */
    }
    set({ currency: currency ?? "RWF", compare: Array.isArray(compare) ? compare : [] });
  },
}));
