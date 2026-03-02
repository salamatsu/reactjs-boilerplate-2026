import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useCsrfStore = create(
  persist(
    (set) => ({
      csrfToken: null,
      setCsrfToken: (token) => set({ csrfToken: token }),
      clearCsrfToken: () => set({ csrfToken: null }),
    }),
    {
      name: "app-csrf-token",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
