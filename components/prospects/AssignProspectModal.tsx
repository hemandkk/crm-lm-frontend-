"use client";

import { useEffect, useState } from "react";
import { Button, Select } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAssignProspect } from "@/hooks/useProspects";
import { useSalesEmployees } from "@/hooks/useEmployees";
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
  const [assignedToId, setAssignedToId] = useState("");
  const { employees, isLoading } = useSalesEmployees({
    status: "active",
    pageSize: 200,
    enabled: open,
  });
  const assign = useAssignProspect();

  useEffect(() => {
    if (!open) return;
    setAssignedToId(prospect.assignedToId ? String(prospect.assignedToId) : "");
  }, [open, prospect.assignedToId]);

  const options = employees.map((e) => ({
    value: String(e.id),
    label: e.employeeId
      ? `${e.name} (${e.employeeId})${e.branchName ? ` — ${e.branchName}` : ""}`
      : `${e.name}${e.branchName ? ` — ${e.branchName}` : ""}`,
  }));

  const handleClose = () => {
    onClose();
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedToId) return;
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
          <Select
            label="Assign to employee *"
            placeholder={isLoading ? "Loading…" : "Select employee"}
            options={options}
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            disabled={isLoading}
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
              disabled={!assignedToId}
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
