"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamOverviewPage() {
  return (
    <TeamSection
      section="overview"
      requiredRole="admin"
      showSupervisorFilter={true}
    />
  );
}
