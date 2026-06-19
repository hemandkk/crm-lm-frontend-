"use client";

import { Card, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentType: "advance" | "installment" | "final";
  receiptUrl?: string | null;
  notes?: string;
}
const colorMap = {
  advance: "bg-blue-100 text-blue-700",

  installment: "bg-orange-100 text-orange-700",

  final: "bg-green-100 text-green-700",
};

interface PaymentSummaryProps {
  payments: Payment[];
  prospectId?: string;
  estimatedValue: number;
  onAddPayment: () => void;
}

export default function PaymentSummary({
  payments,
  estimatedValue,
  onAddPayment,
  prospectId,
}: PaymentSummaryProps) {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const balance = Math.max(estimatedValue - totalPaid, 0);

  const percentage =
    estimatedValue > 0 ? Math.round((totalPaid / estimatedValue) * 100) : 0;

  const paymentStatus =
    percentage === 0
      ? "Not Paid"
      : percentage < 50
        ? "Advance Paid"
        : percentage < 100
          ? "Partially Paid"
          : "Fully Paid";

  return (
    <Card title="Payments">
      {" "}
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-gray-500">Deal Value</p>

            <p className="text-lg font-semibold">
              ₹{estimatedValue.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs text-gray-500">Total Paid</p>

            <p className="text-lg font-semibold text-green-600">
              ₹{totalPaid.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs text-gray-500">Balance</p>

            <p className="text-lg font-semibold text-red-600">
              ₹{balance.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-xs text-gray-500">Status</p>

            <p className="text-sm font-medium">{paymentStatus}</p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Payment Progress</span>

            <span>{percentage}%</span>
          </div>

          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all"
              style={{
                width: `${Math.min(percentage, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <Button type="button" onClick={onAddPayment}>
            + Add Payment
          </Button>
        </div>

        {/* Payment List */}
        <div className="space-y-3">
          {payments.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-6 border rounded-lg">
              No payments added yet
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      ₹{payment.amount.toLocaleString()}
                    </h4>

                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      colorMap[payment.paymentType],
                    )}
                  >
                    {payment.paymentType}
                  </span>
                </div>

                {payment.notes && (
                  <p className="text-sm text-gray-600 mt-3">{payment.notes}</p>
                )}

                {payment.receiptUrl && (
                  <div className="mt-3">
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 text-sm hover:underline"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
