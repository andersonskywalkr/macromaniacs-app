import { create } from 'zustand';
import type { FoodItem } from '@/api/types/domain';

export interface MealDraftItem {
  food: FoodItem;
  amountGrams: number;
}

interface MealDraftStore {
  items: MealDraftItem[];
  addItem: (item: MealDraftItem) => void;
  updateAmount: (foodId: string, amountGrams: number) => void;
  removeItem: (foodId: string) => void;
  clear: () => void;
}

// Estado local puro de UI — o cálculo aqui é só feedback visual imediato,
// o backend recalcula os totais e é a fonte de verdade (RNF-02, seção 93).
export const useMealDraftStore = create<MealDraftStore>((set) => ({
  items: [],

  addItem: (item) =>
    set((state) => ({ items: [...state.items, item] })),

  updateAmount: (foodId, amountGrams) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.food.id === foodId ? { ...i, amountGrams } : i,
      ),
    })),

  removeItem: (foodId) =>
    set((state) => ({ items: state.items.filter((i) => i.food.id !== foodId) })),

  clear: () => set({ items: [] }),
}));
