import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useCurrentActiveUserToken = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      reset: () => set({ token: null, user: null }),
    }),
    {
      name: "app-active-user-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAdminAuthStore = create(
  persist(
    (set) => ({
      userData: null,
      token: null,
      refreshToken: null,
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setUserData: (userData) => set({ userData }),
      reset: () => set({ userData: null, token: null, refreshToken: null }),
    }),
    {
      name: "app-admin-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
