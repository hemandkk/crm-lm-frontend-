import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthUser, UserRole } from "@/types";
import { refreshAccessToken, tokenStore } from "@/lib/api";

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

async function restoreSession() {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  // Prefer existing access token from sessionStorage if still present
  if (tokenStore.getAccess()) return true;

  try {
    await refreshAccessToken();
    return true;
  } catch {
    tokenStore.clearAll();
    return false;
  }
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
      // Persist user metadata only — tokens live in tokenStore
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          useAuthStore.setState({ hydrated: true });
          return;
        }

        void (async () => {
          const hasUser = !!state.user;
          const hasRefresh = !!tokenStore.getRefresh();

          if (!hasUser || !hasRefresh) {
            tokenStore.clearAll();
            useAuthStore.setState({
              user: null,
              role: null,
              isAuthenticated: false,
              hydrated: true,
            });
            return;
          }

          const ok = await restoreSession();
          useAuthStore.setState({
            isAuthenticated: ok,
            user: ok ? state.user : null,
            role: ok ? state.role : null,
            hydrated: true,
          });
        })();
      },
    },
  ),
);
