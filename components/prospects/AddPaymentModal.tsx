"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCheck } from "lucide-react";
import { Modal, Input, Select, Button } from "@/components/ui";
import { useCreatePayment } from "@/hooks";
import { paymentTypeOptions, toMoneyNumber } from "@/lib/utils";

const PAYMENT_TYPE_ENUM = [
  "advance",
  "installment",
  "full_payment",
  "registration_fee",
  "before_exam_fee",
  "after_result_fee",
] as const;

const schema = z.object({
  amount: z.preprocess(
    (v) => toMoneyNumber(v),
    z.number({ error: "Enter valid amount" }).positive("Must be positive"),
  ),
  paymentType: z.enum(PAYMENT_TYPE_ENUM),
  paymentDate: z.string().min(1, "Date required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  prospectId: string;
  prospectName: string;
  isFirstPayment?: boolean;
}

export default function AddPaymentModal({
  open,
  onClose,
  prospectId,
  prospectName,
  isFirstPayment = false,
}: AddPaymentModalProps) {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const createPayment = useCreatePayment();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      amount: 0,
      paymentType: isFirstPayment ? "registration_fee" : "installment",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) setReceiptFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [] },
    maxFiles: 1,
  });

  const onSubmit = (values: FormValues) => {
    createPayment.mutate(
      {
        prospectId,
        amount: toMoneyNumber(values.amount),
        paymentType: values.paymentType,
        paymentDate: values.paymentDate,
        notes: values.notes || "",
        receipt: receiptFile ?? undefined,
      },
      {
        onSuccess: () => {
          reset();
          setReceiptFile(null);
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add payment — ${prospectName}`}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="text-white bg-blue-950"
            onClick={handleSubmit(onSubmit)}
            isLoading={createPayment.isPending}
          >
            Record payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {isFirstPayment && (
          <div className="text-xs text-warning-700 bg-warning-50 dark:bg-warning-900/20 px-3 py-2 rounded-lg border border-warning-200 dark:border-warning-800">
            First payment is recorded as <strong>Resgistration Fee</strong>.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount (₹) *"
            type="number"
            step={1}
            min={1}
            placeholder="30000"
            error={errors.amount?.message}
            {...register("amount", { setValueAs: (v) => toMoneyNumber(v) })}
          />
          <Input
            label="Payment date *"
            type="date"
            error={errors.paymentDate?.message}
            {...register("paymentDate")}
          />
        </div>

        <Controller
          name="paymentType"
          control={control}
          render={({ field }) => (
            <Select
              className="dark:text-white text-black bg-white dark:bg-black disabled:bg-[#10182800] "
              label="Payment type *"
              options={[...paymentTypeOptions]}
              error={errors.paymentType?.message}
              disabled={isFirstPayment}
              {...field}
            />
          )}
        />

        <Input
          label="Notes"
          placeholder="Optional note about this payment"
          {...register("notes")}
        />

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Receipt
          </p>
          {receiptFile ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-success-50 dark:bg-success-900/20 border border-success-200 rounded-lg text-sm text-success-700">
              <FileCheck size={16} />
              <span className="font-medium">{receiptFile.name}</span>
              <button
                type="button"
                onClick={() => setReceiptFile(null)}
                className="ml-auto text-xs text-gray-400 hover:text-gray-600"
              >
                Remove
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary-400 bg-primary-50 dark:bg-primary-900/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary-300"
              }`}
            >
              <input {...getInputProps()} />
              <Upload size={18} className="mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">
                {isDragActive
                  ? "Drop receipt here"
                  : "Drag & drop or click to upload receipt (PDF / image)"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
