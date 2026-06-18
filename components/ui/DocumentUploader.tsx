"use client";

import { Input, Card } from "@/components/ui";

const DOCUMENTS = [
  { key: "aadhaar", label: "Aadhaar" },
  { key: "photo", label: "Passport Photo" },
  { key: "sslc", label: "SSLC" },
  { key: "plus_two", label: "+2 Certificate" },
  { key: "degree", label: "Degree Certificate" },
  { key: "agreement", label: "Agreement" },
];

interface Props {
  value: Record<string, File | null>;
  onChange: (value: Record<string, File | null>) => void;
}

export default function DocumentUploader({ value, onChange }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {DOCUMENTS.map((doc) => (
        <div key={doc.key} className="border rounded-lg p-4">
          <label className="block mb-2 text-sm font-medium">{doc.label}</label>

          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];

              onChange({
                ...value,
                [doc.key]: file ?? null,
              });
            }}
          />

          {value[doc.key] && (
            <p className="text-xs text-green-600 mt-2">
              {value[doc.key]?.name}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
