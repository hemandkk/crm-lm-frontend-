"use client";
import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Input, Select, Textarea, Button, Card } from "@/components/ui";
import { useCreateProspect, useUpdateProspect } from "@/hooks/useProspects";
import { useCourses } from "@/hooks";
import type { PaymentFormValues, Prospect } from "@/types";

import "react-day-picker/style.css";
import DatePicker from "../ui/DatePicker";
import DocumentUploader from "../ui/DocumentUploader";
import PaymentSummary from "./PaymentSummary";
import PaymentModal from "../ui/PaymentModal";
const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone required"),
  fatherName: z.string().min(1, "Father's name required"),
  motherName: z.string().min(1, "Mother's name required"),
  dob: z.string().min(1, "Date of birth is required"),
  courseId: z.string().min(1, "Course is required"),
  specialization: z.string().optional().default(""),
  address: z.string().min(5, "Address required"),
  deliveryAddress: z.string().optional().default(""),
  deliveryDate: z.string().optional().default(""),
  estimatedValue: z
    .number({ error: "Enter a valid amount" })
    .positive("Must be positive"),
  notes: z.string().optional().default(""),
  documents: z.array(
    z.object({
      docType: z.enum([
        "aadhaar",
        "photo",
        "sslc",
        "plus_two",
        "degree",
        "agreement",
      ]),
      existingUrl: z.string().optional(),
      file: z.any().optional(),
      fileName: z.string().optional(),
    }),
  ),
  payments: z.array(
    z.object({
      id: z.string().optional(), // temp ID for UI
      amount: z.number().positive(),
      paymentDate: z.string(),
      paymentType: z.enum(["advance", "installment", "final"]),
      receipt: z.any().optional(),
      receiptUrl: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

export type FormValues = z.infer<typeof schema>;

interface ProspectFormProps {
  prospect?: Prospect;
  mode: "create" | "edit";
}

export default function ProspectForm({ prospect, mode }: ProspectFormProps) {
  const router = useRouter();
  const { data: courses } = useCourses();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const createMutation = useCreateProspect();
  const updateMutation = useUpdateProspect(prospect?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: prospect?.name ?? "",
      email: prospect?.email ?? "",
      phone: prospect?.phone ?? "",
      fatherName: prospect?.fatherName ?? "",
      motherName: prospect?.motherName ?? "",
      dob: prospect?.dob ?? "",
      courseId: prospect?.courseId ?? "",
      specialization: prospect?.specialization ?? "",
      address: prospect?.address ?? "",
      deliveryAddress: prospect?.deliveryAddress ?? "",
      deliveryDate: prospect?.deliveryDate ?? "",
      estimatedValue:
        prospect?.estimatedValue ?? (undefined as unknown as number),
      notes: prospect?.notes ?? "",

      payments: prospect?.payments ?? [],
      documents: [
        { docType: "aadhaar" },
        { docType: "photo" },
        { docType: "sslc" },
        { docType: "plus_two" },
        { docType: "degree" },
        { docType: "agreement" },
      ],
    },
  });
  const values = getValues();
  console.log("all ", values);
  const watchedValues = watch();
  console.log("watchedValues", watchedValues);

  // 1. Watch payments from form state
  const watchedPayments = watch("payments") ?? [];
  const estimatedValue = watch("estimatedValue") ?? 0;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "payments",
  });

  // 2. Handler for modal in form mode
  const handleAddPayment = (paymentData: PaymentFormValues) => {
    // Generate a temporary ID for the UI
    const tempPayment = {
      ...paymentData,
      id: `temp-${Date.now()}`,
      receiptUrl: null, // File will be handled on final submit
    };

    append(tempPayment);
  };
  const onSubmit = (values: FormValues) => {
    /* if (mode === "create") {
      createMutation.mutate(values, {
        onSuccess: () => router.push("/employee/leads"),
      });
    } else {
      updateMutation.mutate(values, {
        onSuccess: () => router.push(`/employee/leads/${prospect!.id}`),
      });
    } */

    // In ProspectForm.tsx
    const onSubmit = async (values: FormValues) => {
      const formData = new FormData();

      // Add all prospect fields
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("fatherName", values.fatherName);
      formData.append("motherName", values.motherName);
      formData.append("dob", values.dob);
      formData.append("courseId", values.courseId);
      formData.append("specialization", values.specialization || "");
      formData.append("address", values.address);
      formData.append("deliveryAddress", values.deliveryAddress || "");
      formData.append("deliveryDate", values.deliveryDate || "");
      formData.append("estimatedValue", String(values.estimatedValue));
      formData.append("notes", values.notes || "");

      // Add payments as JSON string
      const paymentsForBackend = values.payments.map((p, index) => ({
        amount: p.amount,
        paymentType: p.paymentType,
        paymentDate: p.paymentDate,
        notes: p.notes,
        // We don't send receipt here - files are sent separately
        hasReceipt: !!p.receipt, // Flag to help backend know which receipt belongs where
      }));
      formData.append("payments", JSON.stringify(paymentsForBackend));

      // Add receipt files in order (must match payments array order)
      values.payments.forEach((p) => {
        if (p.receipt) {
          formData.append("paymentReceipts", p.receipt);
        }
      });

      // Add documents if any
      values.documents.forEach((doc) => {
        if (doc.file) {
          formData.append("documents", doc.file);
          formData.append("docTypes", doc.docType);
        }
      });

      if (mode === "create") {
        createMutation.mutate(formData, {
          onSuccess: () => router.push("/employee/leads"),
        });
      } else {
        // For edit, we might want to replace payments entirely
        formData.append("replacePayments", "true");
        updateMutation.mutate(
          { id: prospect!.id, data: formData },
          { onSuccess: () => router.push(`/employee/leads/${prospect!.id}`) },
        );
      }
    };
  };

  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  const courseOptions =
    courses?.map((c) => ({ value: c.id, label: c.name })) ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Personal info */}
      <Card title="Personal information">
        payment status(reg, 50% , full, ) mark exam attend, from list as well,
        mark delivery completed, payment slips
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Full name *"
            placeholder="Student full name"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email *"
            type="email"
            placeholder="student@email.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Phone *"
            placeholder="+91 99999 99999"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label="Father's name *"
            placeholder="Father's full name"
            error={errors.fatherName?.message}
            {...register("fatherName")}
          />
          <Input
            label="Mother's name *"
            placeholder="Mother's full name"
            error={errors.motherName?.message}
            {...register("motherName")}
          />
          <Controller
            name="dob"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Date of Birth"
                allowPast
                allowFuture={false}
                startMonth={new Date(1950, 0)}
                endMonth={new Date()}
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString().split("T")[0] : "")
                }
                error={errors.dob?.message}
              />
            )}
          />
        </div>
      </Card>

      {/* Course info */}
      <Card title="Course details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="courseId"
            control={control}
            render={({ field }) => (
              <Select
                label="Course *"
                placeholder="Select course"
                options={courseOptions}
                error={errors.courseId?.message}
                {...field}
              />
            )}
          />
          <Input
            label="Specialization"
            placeholder="e.g. AI & Machine Learning"
            {...register("specialization")}
          />
          <Input
            label="Deal value (₹) *"
            type="number"
            placeholder="120000"
            error={errors.estimatedValue?.message}
            {...register("estimatedValue", { valueAsNumber: true })}
          />
        </div>
      </Card>

      {/* Address & delivery */}
      <Card title="Address & delivery">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Address *"
            placeholder="Full residential address"
            error={errors.address?.message}
            {...register("address")}
          />
          <Textarea
            label="Delivery address"
            placeholder="Where to deliver study materials (if different)"
            {...register("deliveryAddress")}
          />

          <Controller
            name="deliveryDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Delivery Date"
                allowFuture
                allowPast={false}
                endMonth={new Date(new Date().getFullYear() + 10, 0)}
                startMonth={new Date()}
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString().split("T")[0] : "")
                }
              />
            )}
          />
        </div>
      </Card>

      {/* Notes */}
      <Card title="Notes">
        <Textarea
          label="Notes / comments"
          placeholder="Any additional notes about this prospect…"
          className="min-h-[100px]"
          {...register("notes")}
        />
      </Card>
      {/* Upload section */}

      <Card title="Documents">
        <DocumentUploader control={control} />
      </Card>
      {/* <Card title={`Payment`}>
        <Button
          type="button"
          className=" text-black border-gray-700 dark:bg-gray-800 "
          onClick={() => {
            setPaymentModalOpen(true);
            append({
              amount: 0,
              paymentDate: "",
              paymentType: "advance",
              notes: "",
            });
          }}
        >
          + Add Payment
        </Button>
      </Card> */}

      <Card title="Payment">
        <PaymentSummary
          payments={watchedPayments}
          estimatedValue={estimatedValue}
          onAddPayment={() => setPaymentModalOpen(true)}
        />
      </Card>

      {/* Dual-mode modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleAddPayment} // ← Form mode (no prospectId)
      />

      <Card title="Exam Status"> Exam</Card>
      {/* Google Sheets notice */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg text-xs text-primary-700 dark:text-primary-400">
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          On save, this prospect will be automatically synced to the connected
          Google Sheet in the background.
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="bg-gray-800 text-white dark:bg-gray-800 "
          type="submit"
          variant="primary"
          isLoading={isPending}
        >
          {mode === "create" ? "Create prospect" : "Save changes"}
        </Button>
        <Button
          className=" text-black border-gray-700 dark:bg-gray-800 "
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
