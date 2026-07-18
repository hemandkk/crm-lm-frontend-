"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamExportsPage() {
  return (
    <TeamSection
      section="exports"
      requiredRole="manager"
      showSupervisorFilter={false}
    />
  );
}
