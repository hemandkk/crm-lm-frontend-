"use client";

import { Controller, useForm } from "react-hook-form";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DatePicker from "./DatePicker";
import { useCreatePayment } from "@/hooks";

interface PaymentFormValues {
  amount: number;
  paymentType: "advance" | "installment" | "final";
  paymentDate: string;
  notes?: string;
  receipt?: File;
}

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentType: z.enum(["advance", "installment", "final"]),
  paymentDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  receipt: z.any().optional(),
});

// --- Mode 1: Form-integrated (no API call) ---
interface FormModeProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => void; // Parent handles the data
  prospectId?: never;
}

// --- Mode 2: Standalone API call ---
interface StandaloneModeProps {
  open: boolean;
  onClose: () => void;
  prospectId: string;
  onSubmit?: never;
}

type PaymentModalProps = FormModeProps | StandaloneModeProps;

export default function PaymentModal({
  open,
  onClose,
  prospectId,
  onSubmit: onFormSubmit,
}: PaymentModalProps) {
  const isFormMode = !!onFormSubmit;
  const mutation = useCreatePayment();

  const { control, register, handleSubmit, reset } = useForm<PaymentFormValues>(
    {
      resolver: zodResolver(schema),
      defaultValues: {
        paymentDate: new Date().toISOString().split("T")[0],
        paymentType: "installment",
        amount: 0,
      },
    },
  );

  const handleClose = () => {
    reset(); // Clear form on close
    onClose();
  };

  const submit = (values: PaymentFormValues) => {
    if (isFormMode) {
      // Mode 1: Just pass data up to parent form
      onFormSubmit(values);
      handleClose();
    } else {
      // Mode 2: Call API directly
      const formData = new FormData();
      formData.append("prospectId", prospectId);
      formData.append("amount", String(values.amount));
      formData.append("paymentType", values.paymentType);
      formData.append("paymentDate", values.paymentDate);
      if (values.notes) formData.append("notes", values.notes);
      if (values.receipt) formData.append("receipt", values.receipt);

      mutation.mutate(formData, {
        onSuccess: () => handleClose(),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Input
            label="Amount *"
            type="number"
            {...register("amount", { valueAsNumber: true })}
          />

          <Controller
            control={control}
            name="paymentDate"
            render={({ field }) => (
              <DatePicker
                label="Payment Date *"
                allowPast
                allowFuture={false}
                startMonth={new Date(2020, 0)}
                endMonth={new Date()}
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date?.toISOString().split("T")[0])
                }
              />
            )}
          />

          <Controller
            control={control}
            name="paymentType"
            render={({ field }) => (
              <Select
                label="Payment Type *"
                options={[
                  { value: "advance", label: "Advance" },
                  { value: "installment", label: "Installment" },
                  { value: "final", label: "Final" },
                ]}
                {...field}
              />
            )}
          />

          <Controller
            control={control}
            name="receipt"
            render={({ field: { onChange, value, ...field } }) => (
              <Input
                label="Receipt"
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => onChange(e.target.files?.[0])}
                {...field}
              />
            )}
          />

          <Textarea label="Notes" {...register("notes")} />

          <Button type="submit" isLoading={!isFormMode && mutation.isPending}>
            Save Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
