"use client";

import TeamSection from "@/components/team/TeamSection";

export default function TeamPerformancePage() {
  return (
    <TeamSection
      section="performance"
      requiredRole="sales_head"
      showSupervisorFilter={false}
    />
  );
}
