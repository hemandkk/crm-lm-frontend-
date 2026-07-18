"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { useMarkExamStatus } from "@/hooks/useProspects";

interface Props {
  prospectId: string;
  initialAttended: boolean;
  initialCertified: boolean;
}

export default function ExamStatusCard({
  prospectId,
  initialAttended,
  initialCertified,
}: Props) {
  const markExam = useMarkExamStatus();
  const [attended, setAttended] = useState(initialAttended);
  const [certified, setCertified] = useState(initialCertified);

  const save = async () => {
    await markExam.mutateAsync({
      id: prospectId,
      field: "examAttended",
      value: attended,
    });
    await markExam.mutateAsync({
      id: prospectId,
      field: "examCertified",
      value: certified,
    });
  };

  return (
    <Card title="Exam Status">
      <div className="space-y-4">
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={attended}
            onChange={(e) => setAttended(e.target.checked)}
          />
          Exam Attended
        </label>

        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={certified}
            onChange={(e) => setCertified(e.target.checked)}
          />
          Exam Certified
        </label>

        <Button type="button" onClick={() => void save()} isLoading={markExam.isPending}>
          Save Exam Status
        </Button>
      </div>
    </Card>
  );
}
