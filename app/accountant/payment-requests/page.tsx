"use client";

import AppShell from "@/components/layout/AppShell";
import PaymentRequestsPage from "@/components/payment-requests/PaymentRequestsPage";

export default function AccountantPaymentRequestsPage() {
  return (
    <AppShell title="Payment Requests" requiredRole="accountant">
      <PaymentRequestsPage />
    </AppShell>
  );
}
