"use client";

import { useState } from "react";
import { Button, Select } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadProspectDocument } from "@/hooks/useProspects";
import type { DocType } from "@/types";

const DOC_OPTIONS: { value: DocType; label: string }[] = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "photo", label: "Passport Photo" },
  { value: "sslc", label: "SSLC" },
  { value: "plus_two", label: "+2 Certificate" },
  { value: "degree", label: "Degree Certificate" },
  { value: "agreement", label: "Agreement" },
];

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  prospectId: string;
  prospectName: string;
}

export default function UploadDocumentModal({
  open,
  onClose,
  prospectId,
  prospectName,
}: UploadDocumentModalProps) {
  const [docType, setDocType] = useState<DocType>("aadhaar");
  const [files, setFiles] = useState<File[]>([]);
  const upload = useUploadProspectDocument();

  const handleClose = () => {
    setDocType("aadhaar");
    setFiles([]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) return;
    try {
      for (const file of files) {
        await upload.mutateAsync({ prospectId, docType, file });
      }
      handleClose();
    } catch {
      // toast handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document — {prospectName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Document Type *"
            options={DOC_OPTIONS}
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Files *
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary-50 file:text-primary-700"
              onChange={(e) =>
                setFiles(e.target.files ? Array.from(e.target.files) : [])
              }
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f) => (
                  <li
                    key={f.name + f.size}
                    className="text-xs text-gray-600 dark:text-gray-400 truncate"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={upload.isPending}
              disabled={!files.length}
            >
              Upload{files.length > 1 ? ` (${files.length})` : ""}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
