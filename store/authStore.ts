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

  if (tokenStore.getAccess()) return true;

  try {
    await refreshAccessToken();
    return true;
  } catch {
    tokenStore.clearAll();
    return false;
  }
}

/**
 * Runs after `create()` finishes (via setTimeout) to avoid TDZ on useAuthStore.
 * Also ignores itself if the user already logged in while this was pending.
 */
async function finishAuthHydration(rehydrated: AuthState | undefined) {
  const current = useAuthStore.getState();

  // Fresh login beat rehydration — don't wipe it
  if (current.isAuthenticated && tokenStore.getAccess()) {
    useAuthStore.setState({ hydrated: true });
    return;
  }

  if (!rehydrated?.user || !tokenStore.getRefresh()) {
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

  // Re-check after await — login may have completed during refresh
  const after = useAuthStore.getState();
  if (after.isAuthenticated && tokenStore.getAccess()) {
    useAuthStore.setState({ hydrated: true });
    return;
  }

  useAuthStore.setState({
    isAuthenticated: ok,
    user: ok ? rehydrated.user : null,
    role: ok ? rehydrated.role : null,
    hydrated: true,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      role: null,
      hydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        const role = (user.role?.toLowerCase?.() ?? user.role) as UserRole;
        tokenStore.setAccess(accessToken);
        tokenStore.setRefresh(refreshToken);
        set({
          user: { ...user, role },
          isAuthenticated: true,
          role,
          hydrated: true,
        });
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
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
      onRehydrateStorage: () => (state) => {
        setTimeout(() => {
          void finishAuthHydration(state);
        }, 0);
      },
    },
  ),
);
