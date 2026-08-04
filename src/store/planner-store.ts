import { create } from "zustand";
import { startOfWeek } from "date-fns";

interface PlannerState {
  weekStart: Date;
  setWeekStart: (date: Date) => void;
  goToToday: () => void;
  goToNextWeek: () => void;
  goToPrevWeek: () => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  weekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
  setWeekStart: (date) => set({ weekStart: date }),
  goToToday: () => set({ weekStart: startOfWeek(new Date(), { weekStartsOn: 1 }) }),
  goToNextWeek: () => {
    const d = new Date(get().weekStart);
    d.setDate(d.getDate() + 7);
    set({ weekStart: d });
  },
  goToPrevWeek: () => {
    const d = new Date(get().weekStart);
    d.setDate(d.getDate() - 7);
    set({ weekStart: d });
  },
}));
