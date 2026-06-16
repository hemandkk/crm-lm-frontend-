import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser, UserRole } from "@/types";
import { tokenStore } from "@/lib/api";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  role: UserRole | null;

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

      setAuth: (user, accessToken, refreshToken) => {
        tokenStore.setAccess(accessToken);
        tokenStore.setRefresh(refreshToken);
        set({ user, isAuthenticated: true, role: user.role });
      },

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
      partialize: (state) => ({ user: state.user, role: state.role }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Re-hydrate isAuthenticated from persisted user
          const isAuthenticated = !!state.user && !!tokenStore.getRefresh();
          state.isAuthenticated = isAuthenticated;
          if (!isAuthenticated) {
            state.user = null;
            state.role = null;
          }
        }
      },
    }
  )
);
