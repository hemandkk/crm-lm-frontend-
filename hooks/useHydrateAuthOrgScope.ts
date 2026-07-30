"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { employeeService } from "@/services/employeeService";
import { mergeAuthOrgFromEmployee } from "@/lib/authUser";
import { queryKeys } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import type { AuthUser } from "@/types";

function sameIdList(
  a: string[] | null | undefined,
  b: string[] | null | undefined,
) {
  const aa = (a ?? []).map(String);
  const bb = (b ?? []).map(String);
  if (aa.length !== bb.length) return false;
  const set = new Set(aa);
  return bb.every((id) => set.has(id));
}

function orgFieldsEqual(current: AuthUser, next: Partial<AuthUser>) {
  const stateSame = String(current.stateId ?? "") === String(next.stateId ?? "");
  const branchSame =
    String(current.branchId ?? "") === String(next.branchId ?? "");
  const idsSame = sameIdList(current.branchIds, next.branchIds);
  return stateSame && branchSame && idsSame;
}

/**
 * Ensures auth user has stateId / branchIds for scoped roles (esp. sales_head).
 * Older sessions / lean login payloads often omit geo — hydrate from /auth/me
 * or GET /employees/:id so filters can call /masters/branches?stateId=….
 */
export function useHydrateAuthOrgScope() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const updateUser = useAuthStore((s) => s.updateUser);
  const appliedKeyRef = useRef<string | null>(null);

  const needsGeo =
    isAuthenticated &&
    hydrated &&
    !!user?.id &&
    role !== "admin" &&
    (user.stateId == null ||
      String(user.stateId) === "" ||
      (role === "sales_head" &&
        (!user.branchIds || user.branchIds.length === 0)));

  const userId = user?.id;
  const employeeCode = user?.employeeId || user?.employee_id;

  const { data } = useQuery({
    queryKey: [...queryKeys.me, "org-scope", userId, employeeCode],
    enabled: needsGeo,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const me = await authService.me();
        if (me.stateId || (me.branchIds && me.branchIds.length)) {
          return { kind: "me" as const, me };
        }
      } catch {
        // /auth/me may not exist — fall through
      }

      try {
        const employee = await employeeService.get(userId!);
        return { kind: "employee" as const, employee };
      } catch {
        if (!employeeCode) throw new Error("Missing employee id");
        const list = await employeeService.list({
          search: employeeCode,
          pageSize: 5,
        });
        const rows = list.items ?? list.data ?? [];
        const match =
          rows.find(
            (e) =>
              String(e.employeeId).toLowerCase() ===
              String(employeeCode).toLowerCase(),
          ) ?? rows[0];
        if (!match) throw new Error("Employee profile not found");
        return { kind: "employee" as const, employee: match };
      }
    },
  });

  useEffect(() => {
    if (!needsGeo || !userId || !data) return;

    const applyKey = `${userId}:${data.kind}`;
    if (appliedKeyRef.current === applyKey) return;

    const current = useAuthStore.getState().user;
    if (!current) return;

    const next: Partial<AuthUser> =
      data.kind === "me"
        ? {
            stateId: data.me.stateId ?? current.stateId,
            branchId: data.me.branchId ?? current.branchId,
            branchIds: data.me.branchIds ?? current.branchIds,
          }
        : mergeAuthOrgFromEmployee(current, data.employee);

    appliedKeyRef.current = applyKey;

    if (orgFieldsEqual(current, next)) return;
    updateUser(next);
  }, [needsGeo, userId, data, updateUser]);
}
