"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, Button, Spinner, EmptyState, Badge } from "@/components/ui";
import type { UseMutationResult } from "@tanstack/react-query";

export interface NameActiveItem {
  id: string;
  name: string;
  active: boolean;
}

interface SimpleMasterManagerProps {
  title: string;
  description?: string;
  placeholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  data?: NameActiveItem[];
  isLoading?: boolean;
  create: UseMutationResult<
    NameActiveItem,
    unknown,
    { name: string; active?: boolean }
  >;
  update: UseMutationResult<
    NameActiveItem,
    unknown,
    { id: string; data: { name?: string; active?: boolean } }
  >;
  remove: UseMutationResult<unknown, unknown, string>;
}

export default function SimpleMasterManager({
  title,
  description,
  placeholder = "e.g. Name",
  emptyTitle = "No items yet",
  emptyDescription,
  data,
  isLoading = false,
  create,
  update,
  remove,
}: SimpleMasterManagerProps) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<NameActiveItem | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    create.mutate(
      { name: trimmed, active: true },
      { onSuccess: () => setNewName("") },
    );
  };

  const startEdit = (item: NameActiveItem) => {
    setEditing(item);
    setEditName(item.name);
  };

  const saveEdit = () => {
    if (!editing) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    update.mutate(
      { id: editing.id, data: { name: trimmed } },
      {
        onSuccess: () => {
          setEditing(null);
          setEditName("");
        },
      },
    );
  };

  return (
    <Card title={title}>
      {description && (
        <p className="text-[11px] text-gray-400 mb-3">{description}</p>
      )}
      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <Button
          size="sm"
          variant="primary"
          className="text-white"
          leftIcon={<Plus size={13} />}
          onClick={handleAdd}
          isLoading={create.isPending}
          disabled={!newName.trim()}
        >
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !data?.length ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-2">
          {data.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              {editing?.id === item.id ? (
                <div className="flex flex-1 gap-2 min-w-0">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    className="text-white"
                    onClick={saveEdit}
                    isLoading={update.isPending}
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
                  <p className="text-sm text-gray-800 dark:text-gray-200 truncate min-w-0">
                    {item.name}
                  </p>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {!item.active && (
                      <Badge variant="gray" className="mr-1">
                        Inactive
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(item.id)}
                      disabled={remove.isPending}
                      className="p-1 rounded text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
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
  );
}
