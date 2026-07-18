"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamAnalyticsPage() {
  return (
    <TeamSection
      section="analytics"
      requiredRole="manager"
      showSupervisorFilter={false}
    />
  );
}
