"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamExportsPage() {
  return (
    <TeamSection
      section="exports"
      requiredRole="sales_head"
      showSupervisorFilter={false}
    />
  );
}
