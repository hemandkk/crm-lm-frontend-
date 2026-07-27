"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { Card, Button, Spinner, EmptyState } from "@/components/ui";
import {
  useStates,
  useCreateState,
  useUpdateState,
  useDeleteState,
} from "@/hooks";
import type { State } from "@/types";

export default function StatesPage() {
  const [name, setName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [editing, setEditing] = useState<State | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const { data: states, isLoading } = useStates();
  const createState = useCreateState();
  const updateState = useUpdateState();
  const deleteState = useDeleteState();

  const handleAdd = () => {
    const n = name.trim();
    const c = stateCode.trim().toUpperCase();
    if (!n || !c) return;
    createState.mutate(
      { name: n, stateCode: c },
      {
        onSuccess: () => {
          setName("");
          setStateCode("");
        },
      },
    );
  };

  const startEdit = (state: State) => {
    setEditing(state);
    setEditName(state.name);
    setEditCode(state.stateCode);
  };

  const saveEdit = () => {
    if (!editing) return;
    const n = editName.trim();
    const c = editCode.trim().toUpperCase();
    if (!n || !c) return;
    updateState.mutate(
      { id: editing.id, data: { name: n, stateCode: c } },
      {
        onSuccess: () => {
          setEditing(null);
          setEditName("");
          setEditCode("");
        },
      },
    );
  };

  return (
    <AppShell title="States" requiredRole="admin">
      <Card title="State Master">
        <p className="text-[11px] text-gray-400 mb-3">
          States group branches. Code is entered manually (e.g. KL, MH). Delete
          is blocked if the state still has branches or employees.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="State name"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          />
          <input
            value={stateCode}
            onChange={(e) => setStateCode(e.target.value)}
            placeholder="Code"
            className="w-full sm:w-28 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 uppercase"
          />
          <Button
            size="sm"
            variant="primary"
            className="text-white"
            leftIcon={<Plus size={13} />}
            onClick={handleAdd}
            isLoading={createState.isPending}
          >
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !states?.length ? (
          <EmptyState title="No states yet" description="Add a state above." />
        ) : (
          <ul className="space-y-2">
            {states.map((state) => (
              <li
                key={state.id}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {editing?.id === state.id ? (
                  <div className="flex flex-1 flex-col sm:flex-row gap-2 min-w-0">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-900"
                    />
                    <input
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      className="w-full sm:w-24 px-2 py-1 text-sm border rounded-md bg-white dark:bg-gray-900 uppercase"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-white"
                      onClick={saveEdit}
                      isLoading={updateState.isPending}
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
                        {state.name}
                      </p>
                      <p className="text-[11px] font-mono text-gray-400">
                        {state.stateCode}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(state)}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteState.mutate(state.id)}
                        disabled={deleteState.isPending}
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
