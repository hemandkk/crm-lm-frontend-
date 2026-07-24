"use client";

import AppShell from "@/components/layout/AppShell";
import ExpensesPage from "@/components/expenses/ExpensesPage";

export default function AdminExpensesPage() {
  return (
    <AppShell title="Expenses" requiredRole="admin">
      <ExpensesPage />
    </AppShell>
  );
}
