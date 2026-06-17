import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser, UserRole } from "@/types";
import { tokenStore } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  hydrated: boolean;

  setHydrated: (value: boolean) => void;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      role: null,
      hydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        tokenStore.setAccess(accessToken);
        tokenStore.setRefresh(refreshToken);
        set({ user, isAuthenticated: true, role: user.role });
      },
      setHydrated: (value) => set({ hydrated: value }),
      clearAuth: () => {
        tokenStore.clearAll();
        set({ user: null, isAuthenticated: false, role: null });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: "crm-auth",
      storage: createJSONStorage(() => localStorage),
      // Only persist user metadata, never tokens
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const isAuthenticated = !!state.user && !!tokenStore.getRefresh();

        state.isAuthenticated = isAuthenticated;

        if (!isAuthenticated) {
          state.user = null;
          state.role = null;
        }

        state.hydrated = true;
      },
    },
  ),
);
