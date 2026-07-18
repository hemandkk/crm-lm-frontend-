"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamPerformancePage() {
  return (
    <TeamSection
      section="performance"
      requiredRole="manager"
      showSupervisorFilter={false}
    />
  );
}
