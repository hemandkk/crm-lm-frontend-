"use client";

import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";
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
  const [file, setFile] = useState<File | null>(null);
  const upload = useUploadProspectDocument();

  const handleClose = () => {
    setDocType("aadhaar");
    setFile(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    upload.mutate(
      { prospectId, docType, file },
      { onSuccess: () => handleClose() },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document — {prospectName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Document type *"
            options={DOC_OPTIONS}
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
          />
          <Input
            label="File *"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={upload.isPending}
              disabled={!file}
            >
              Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
