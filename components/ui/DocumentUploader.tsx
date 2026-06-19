"use client";

import { Input, Card } from "@/components/ui";
import { Controller, Control, useWatch } from "react-hook-form";

import type { FormValues } from "../prospects/ProspectForm";
const DOCUMENTS = [
  { key: "aadhaar", label: "Aadhaar" },
  { key: "photo", label: "Passport Photo" },
  { key: "sslc", label: "SSLC" },
  { key: "plus_two", label: "+2 Certificate" },
  { key: "degree", label: "Degree Certificate" },
  { key: "agreement", label: "Agreement" },
];

interface Props {
  control: Control<FormValues>;
}

export default function DocumentUploader({ control }: Props) {
  const documents = useWatch({
    control,
    name: "documents",
  });
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {DOCUMENTS.map((doc, index) => {
        const currentDoc = documents?.[index];
        return (
          <div key={doc.key} className="border rounded-lg p-4">
            <label className="block mb-2 text-sm font-medium">
              {doc.label}
            </label>
            {currentDoc?.existingUrl && (
              <div className="mb-2">
                <a
                  href={currentDoc.existingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Current File
                </a>

                <p className="text-xs text-gray-500">{currentDoc.fileName}</p>
              </div>
            )}
            <Controller
              control={control}
              name={`documents.${index}.file`}
              render={({ field }) => (
                <>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => field.onChange(e.target.files?.[0])}
                  />

                  {field.value && (
                    <p className="mt-2 text-xs text-green-600">
                      New file: {field.value.name}
                    </p>
                  )}
                </>
              )}
            />
            {currentDoc?.file && <p>New File: {currentDoc.file.name}</p>}
          </div>
        );
      })}
    </div>
  );
}
