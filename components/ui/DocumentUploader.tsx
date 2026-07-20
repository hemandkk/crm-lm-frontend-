"use client";

import { useRef } from "react";
import {
  useWatch,
  type Control,
  type UseFormGetValues,
  type UseFormSetValue,
} from "react-hook-form";
import { X } from "lucide-react";
import { resolveAssetUrl } from "@/lib/utils";
import { useDeleteDocument } from "@/hooks/useProspects";
import type { DocType } from "@/types";
import type { FormValues } from "../prospects/ProspectForm";

const DOCUMENTS: { key: DocType; label: string }[] = [
  { key: "aadhaar", label: "Aadhaar" },
  { key: "photo", label: "Passport Photo" },
  { key: "sslc", label: "SSLC" },
  { key: "plus_two", label: "+2 Certificate" },
  { key: "degree", label: "Degree Certificate" },
  { key: "agreement", label: "Agreement" },
];

interface Props {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  getValues: UseFormGetValues<FormValues>;
  /** When set, removing an existing file calls DELETE /documents/{id} */
  prospectId?: string;
}

function isTempId(id: number | string | undefined): boolean {
  return id == null || String(id).startsWith("temp-");
}

export default function DocumentUploader({
  control,
  setValue,
  getValues,
  prospectId,
}: Props) {
  const documents = useWatch({ control, name: "documents" }) ?? [];
  const deleteDoc = useDeleteDocument(prospectId);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const appendFiles = (docType: DocType, files: FileList | null) => {
    if (!files?.length) return;
    const current = getValues("documents") ?? [];
    const stamp = Date.now();
    setValue(
      "documents",
      [
        ...current,
        ...Array.from(files).map((file, i) => ({
          id: `temp-${stamp}-${i}-${file.name}`,
          docType,
          file,
          fileName: file.name,
        })),
      ],
      { shouldDirty: true },
    );
  };

  const removeAt = async (index: number) => {
    const current = getValues("documents") ?? [];
    const item = current[index];
    if (!item) return;

    if (!isTempId(item.id) && prospectId) {
      try {
        await deleteDoc.mutateAsync(item.id as number | string);
      } catch {
        return;
      }
    }

    setValue(
      "documents",
      current.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {DOCUMENTS.map((doc) => {
        const items = documents
          .map((d, index) => ({ ...d, index }))
          .filter((d) => d.docType === doc.key);

        return (
          <div key={doc.key} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {doc.label}
              </label>
              <span className="text-[10px] text-gray-400">
                {items.length
                  ? `${items.length} file${items.length === 1 ? "" : "s"}`
                  : "None"}
              </span>
            </div>

            {items.length > 0 && (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={String(item.id ?? item.index)}
                    className="flex items-center gap-2 rounded-md border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 px-2.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      {item.existingUrl ? (
                        <a
                          href={resolveAssetUrl(item.existingUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:underline truncate block"
                        >
                          {item.fileName || "View file"}
                        </a>
                      ) : (
                        <p className="text-xs text-success-700 dark:text-success-400 truncate">
                          {item.fileName || item.file?.name || "New file"}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAt(item.index)}
                      disabled={deleteDoc.isPending}
                      className="shrink-0 p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remove"
                      aria-label="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <input
                ref={(el) => {
                  inputRefs.current[doc.key] = el;
                }}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-300"
                onChange={(e) => {
                  appendFiles(doc.key, e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="text-xs text-primary-600 hover:underline"
                onClick={() => inputRefs.current[doc.key]?.click()}
              >
                + Add another file
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
