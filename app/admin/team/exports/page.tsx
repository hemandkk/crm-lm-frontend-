"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamExportsPage() {
  return (
    <TeamSection
      section="exports"
      requiredRole="admin"
      showSupervisorFilter={true}
    />
  );
}
