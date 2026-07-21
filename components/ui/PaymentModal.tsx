"use client";

import { Controller, useForm } from "react-hook-form";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parse } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DatePicker from "./DatePicker";
import { useCreatePayment } from "@/hooks";
import { paymentTypeOptions } from "@/lib/utils";
import type { PaymentType } from "@/types";

interface PaymentFormValues {
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  notes?: string;
  receipt?: File;
}

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentType: z.enum([
    "advance",
    "installment",
    "full_payment",
    "registration_fee",
    "before_exam_fee",
    "after_result_fee",
  ]),
  paymentDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  receipt: z.instanceof(File, {
    message: "Receipt is required",
  }),
  /* receipt: z
  .any()
  .refine((file) => file instanceof File, {
    message: "Receipt is required",
  }), */
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

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentDate: format(new Date(), "yyyy-MM-dd"),
      paymentType: "installment",
      amount: 0,
    },
  });

  const handleClose = () => {
    reset(); // Clear form on close
    onClose();
  };

  const submit = (values: PaymentFormValues) => {
    if (isFormMode) {
      onFormSubmit(values);
      handleClose();
    } else {
      mutation.mutate(
        {
          prospectId,
          amount: values.amount,
          paymentType: values.paymentType,
          paymentDate: values.paymentDate,
          notes: values.notes,
          receipt: values.receipt,
        },
        { onSuccess: () => handleClose() },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment dfd</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <Input
            label="Amount *"
            type="number"
            {...register("amount", { valueAsNumber: true })}
            error={errors.amount?.message}
          />

          <Controller
            control={control}
            name="paymentDate"
            render={({ field }) => {
              return (
                <DatePicker
                  label="Payment Date *"
                  allowPast
                  allowFuture={false}
                  startMonth={new Date(2020, 0)}
                  endMonth={new Date()}
                  value={
                    field.value
                      ? parse(field.value, "yyyy-MM-dd", new Date())
                      : undefined
                  }
                  onChange={(date) =>
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                  }
                  error={errors.paymentDate?.message}
                />
              );
            }}
          />

          <Controller
            control={control}
            name="paymentType"
            render={({ field }) => (
              <Select
                label="Payment Type *"
                options={[...paymentTypeOptions]}
                {...field}
              />
            )}
          />

          <Controller
            control={control}
            name="receipt"
            render={({ field: { onChange, ref, name, value, ...field } }) => (
              <>
                <Input
                  label="Receipt"
                  type="file"
                  ref={ref}
                  name={name}
                  accept=".pdf,.jpg,.png"
                  onChange={(e) => onChange(e.target.files?.[0])}
                  {...field}
                  error={errors.receipt?.message}
                />
              </>
            )}
          />

          <Textarea label="Notes" {...register("notes")} />

          <Button
            type="submit"
            variant="primary"
            isLoading={!isFormMode && mutation.isPending}
          >
            Save Payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
