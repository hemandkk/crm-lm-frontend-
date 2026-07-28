"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Select } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAssignProspect } from "@/hooks/useProspects";
import { useEmployee, useSalesEmployees } from "@/hooks/useEmployees";
import { useStates, useBranches } from "@/hooks";
import type { Prospect } from "@/types";

interface AssignProspectModalProps {
  open: boolean;
  onClose: () => void;
  prospect: Prospect;
}

export default function AssignProspectModal({
  open,
  onClose,
  prospect,
}: AssignProspectModalProps) {
  const assignedId = prospect.assignedToId ? String(prospect.assignedToId) : "";

  const [stateId, setStateId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const scopeReady = !!stateId && !!branchId;

  const needsAssigneeLookup =
    open &&
    !!assignedId &&
    (!prospect.assignedStateId || !prospect.assignedBranchId);

  const { data: assignedEmployee } = useEmployee(
    assignedId,
    needsAssigneeLookup,
  );

  const { data: states = [] } = useStates(open);
  const { data: branches = [] } = useBranches(
    { stateId: stateId || undefined },
    open && !!stateId,
  );
  const { employees, isLoading } = useSalesEmployees({
    status: "active",
    pageSize: 200,
    stateId: stateId || undefined,
    branchId: branchId || undefined,
    enabled: open && scopeReady,
  });
  const assign = useAssignProspect();

  // Reset + seed from prospect when modal opens
  useEffect(() => {
    if (!open) {
      setHydrated(false);
      return;
    }
    setAssignedToId(assignedId);
    setStateId(
      prospect.assignedStateId ? String(prospect.assignedStateId) : "",
    );
    setBranchId(
      prospect.assignedBranchId ? String(prospect.assignedBranchId) : "",
    );
    setHydrated(true);
  }, [open, assignedId, prospect.assignedStateId, prospect.assignedBranchId]);

  // Fallback: fill state/branch from employee detail API
  useEffect(() => {
    if (!open || !hydrated || !assignedEmployee) return;
    if (!stateId && assignedEmployee.stateId) {
      setStateId(String(assignedEmployee.stateId));
    }
    if (!branchId && assignedEmployee.branchId) {
      setBranchId(String(assignedEmployee.branchId));
    }
  }, [open, hydrated, assignedEmployee, stateId, branchId]);

  const options = useMemo(() => {
    const opts = employees.map((e) => ({
      value: String(e.id),
      label: e.employeeId
        ? `${e.name} (${e.employeeId})${e.branchName ? ` — ${e.branchName}` : ""}`
        : `${e.name}${e.branchName ? ` — ${e.branchName}` : ""}`,
    }));
    if (
      assignedToId &&
      !opts.some((o) => o.value === assignedToId) &&
      (prospect.assignedToName ||
        prospect.assignedEmployeeName ||
        assignedEmployee?.name)
    ) {
      const name =
        assignedEmployee?.name ||
        prospect.assignedToName ||
        prospect.assignedEmployeeName ||
        "Assigned employee";
      const code =
        assignedEmployee?.employeeId || prospect.assignedToCode || "";
      opts.unshift({
        value: assignedToId,
        label: code ? `${name} (${code})` : name,
      });
    }
    return opts;
  }, [employees, assignedToId, prospect, assignedEmployee]);

  const handleClose = () => {
    onClose();
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedToId || !scopeReady) return;
    assign.mutate(
      { id: prospect.id, assignedToId },
      { onSuccess: () => handleClose() },
    );
  };

  const handleUnassign = () => {
    assign.mutate(
      { id: prospect.id, assignedToId: null },
      { onSuccess: () => handleClose() },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign admission — {prospect.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAssign} className="space-y-4">
          {(prospect.assignedEmployeeName || prospect.assignedToName) && (
            <p className="text-xs text-gray-500">
              Currently:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {prospect.assignedToName || prospect.assignedEmployeeName}
                {prospect.assignedToCode ? ` (${prospect.assignedToCode})` : ""}
              </span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                State *
              </label>
              <select
                value={stateId}
                onChange={(e) => {
                  setStateId(e.target.value);
                  setBranchId("");
                  setAssignedToId("");
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.stateCode ? ` (${s.stateCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">
                Branch *
              </label>
              <select
                value={branchId}
                disabled={!stateId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setAssignedToId("");
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600 disabled:opacity-50"
              >
                <option value="">
                  {stateId ? "Select branch" : "Select state first"}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.branchCode ? ` (${b.branchCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Select
            label="Assign to Employee *"
            placeholder={
              !scopeReady
                ? "Select State & Branch First"
                : isLoading
                  ? "Loading…"
                  : "Select Employee"
            }
            options={options}
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            disabled={!scopeReady || isLoading}
          />
          <div className="flex flex-wrap gap-2 justify-end">
            {prospect.assignedToId && (
              <Button
                type="button"
                variant="ghost"
                className="border border-black dark:bg-white dark:text-black "
                onClick={handleUnassign}
                isLoading={assign.isPending}
              >
                Unassign
              </Button>
            )}
            <Button
              type="button"
              className="bg-gray-500 hover:bg-gray-600 text-black"
              variant="secondary"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!assignedToId || !scopeReady}
              isLoading={assign.isPending}
              className="text-white dark:text-white"
            >
              Save assignment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
