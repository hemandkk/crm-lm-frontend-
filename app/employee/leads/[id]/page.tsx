
import AppShell from "@/components/layout/AppShell";
import ProspectDetail from "@/components/prospects/ProspectDetail";

/* interface PageProps {
  params: { id: string };
} */
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}
export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AppShell title="Lead Detail" requiredRole="employee">
      <ProspectDetail id={id} />
    </AppShell>
  );
}
