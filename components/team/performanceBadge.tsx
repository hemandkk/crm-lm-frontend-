import { Badge } from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import type { TeamPerformanceStatus } from "@/types/team";

export function performanceStatusBadge(
  status: TeamPerformanceStatus | string | null | undefined,
) {
  const key = String(status ?? "")
    .trim()
    .toLowerCase();
  const map: Record<
    string,
    { label: string; variant: BadgeVariant }
  > = {
    high: { label: "High", variant: "success" },
    average: { label: "Average", variant: "warning" },
    low: { label: "Low", variant: "danger" },
  };
  const cfg = map[key] ?? { label: status || "—", variant: "gray" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
