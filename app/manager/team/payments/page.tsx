"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamPaymentsPage() {
  return (
    <TeamSection
      section="payments"
      requiredRole="manager"
      showSupervisorFilter={false}
    />
  );
}
