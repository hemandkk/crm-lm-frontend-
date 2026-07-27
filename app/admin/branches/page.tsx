"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card, Button, Spinner, EmptyState } from "@/components/ui";
import {
  useStates,
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "@/hooks";
import type { Branch } from "@/types";

export default function BranchesPage() {
  const [name, setName] = useState("");
  const [stateId, setStateId] = useState("");
  const [filterStateId, setFilterStateId] = useState("");
  const [editing, setEditing] = useState<Branch | null>(null);
  const [editName, setEditName] = useState("");
  const [editStateId, setEditStateId] = useState("");

  const { data: states } = useStates();
  const { data: branches, isLoading } = useBranches(
    filterStateId ? { stateId: filterStateId } : undefined,
  );
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const handleAdd = () => {
    const n = name.trim();
    if (!n || !stateId) return;
    createBranch.mutate(
      { name: n, stateId },
      {
        onSuccess: () => {
          setName("");
        },
      },
    );
  };

  const startEdit = (branch: Branch) => {
    setEditing(branch);
    setEditName(branch.name);
    setEditStateId(branch.stateId);
  };

  const saveEdit = () => {
    if (!editing) return;
    const n = editName.trim();
    if (!n || !editStateId) return;
    updateBranch.mutate(
      { id: editing.id, data: { name: n, stateId: editStateId } },
      {
        onSuccess: () => {
          setEditing(null);
          setEditName("");
          setEditStateId("");
        },
      },
    );
  };

  return (
    <AppShell title="Branches" requiredRole="admin">
      <Card title="Branch Master">
        <p className="text-[11px] text-gray-400 mb-3">
          Branches belong to a state. Branch code is auto-generated (BR0001…).
          Delete is blocked if employees are assigned to the branch.
        </p>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs text-gray-500">Filter by state:</span>
          <select
            value={filterStateId}
            onChange={(e) => setFilterStateId(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="">All states</option>
            {states?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.stateCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            className="w-full sm:w-48 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="">Select state *</option>
            {states?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.stateCode})
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Branch name"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          />
          <Button
            size="sm"
            variant="primary"
            className="text-white"
            leftIcon={<Plus size={13} />}
            onClick={handleAdd}
            isLoading={createBranch.isPending}
            disabled={!stateId || !name.trim()}
          >
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !branches?.length ? (
          <EmptyState
            title="No branches yet"
            description="Select a state and add a branch above."
          />
        ) : (
          <ul className="space-y-2">
            {branches.map((branch) => (
              <li
                key={branch.id}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {editing?.id === branch.id ? (
                  <div className="flex flex-1 flex-col sm:flex-row gap-2 min-w-0">
                    <select
                      value={editStateId}
                      onChange={(e) => setEditStateId(e.target.value)}
                      className="w-full sm:w-40 px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-900"
                    >
                      {states?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-900"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-white"
                      onClick={saveEdit}
                      isLoading={updateBranch.isPending}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {branch.name}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        <span className="font-mono">{branch.branchCode}</span>
                        {" · "}
                        {branch.stateName || "—"}
                        {branch.stateCode ? ` (${branch.stateCode})` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(branch)}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBranch.mutate(branch.id)}
                        disabled={deleteBranch.isPending}
                        className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
