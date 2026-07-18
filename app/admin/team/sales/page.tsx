"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamSalesPage() {
  return (
    <TeamSection
      section="sales"
      requiredRole="admin"
      showSupervisorFilter={true}
    />
  );
}
