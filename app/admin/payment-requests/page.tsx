"use client";

import AppShell from "@/components/layout/AppShell";
import PaymentRequestsPage from "@/components/payment-requests/PaymentRequestsPage";

export default function AdminPaymentRequestsPage() {
  return (
    <AppShell title="Payment Requests" requiredRole="admin">
      <PaymentRequestsPage />
    </AppShell>
  );
}
