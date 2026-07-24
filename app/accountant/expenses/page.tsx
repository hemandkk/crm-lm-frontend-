"use client";

import AppShell from "@/components/layout/AppShell";
import ExpensesPage from "@/components/expenses/ExpensesPage";

export default function AccountantExpensesPage() {
  return (
    <AppShell title="Expenses" requiredRole="accountant">
      <ExpensesPage />
    </AppShell>
  );
}
