"use client";
import { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import toast from "react-hot-toast";
import { Input, Select, Textarea, Button, Card } from "@/components/ui";
import {
  useCreateProspect,
  useNextProspectId,
  useUpdateProspect,
} from "@/hooks/useProspects";
import { useCourses } from "@/hooks";
import type { DocType, PaymentFormValues, Prospect } from "@/types";

import "react-day-picker/style.css";
import DatePicker from "../ui/DatePicker";
import DocumentUploader from "../ui/DocumentUploader";
import PaymentSummary from "./PaymentSummary";
import PaymentModal from "../ui/PaymentModal";

const DOC_TYPES: DocType[] = [
  "aadhaar",
  "photo",
  "sslc",
  "plus_two",
  "degree",
  "agreement",
];

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email("Valid email required"),
  prospect_id: z.string(),
  phone: z.string().min(10, "Valid phone required"),
  password: z
    .string()
    .min(8, "Min 8 characters required.")
    .optional()
    .or(z.literal("")),
  fatherName: z.string().min(1, "Father's name required"),
  motherName: z.string().min(1, "Mother's name required"),
  dob: z.string().min(1, "Date of birth is required"),
  courseId: z.string().min(1, "Course is required"),
  specialization: z.string().optional(),
  address: z.string().min(5, "Address required"),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.string().optional(),
  estimatedValue: z
    .number({ error: "Enter a valid amount" })
    .positive("Must be positive"),
  notes: z.string().optional(),
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
      id: z.string().optional(),
      amount: z.number().positive(),
      paymentDate: z.string(),
      paymentType: z.enum(["advance", "installment", "final"]),
      receipt: z.any().optional(),
      receiptUrl: z.string().optional().nullable(),
      notes: z.string().optional(),
    }),
  ),
});

export type FormValues = z.infer<typeof schema>;

function buildDocumentDefaults(prospect?: Prospect): FormValues["documents"] {
  return DOC_TYPES.map((docType) => {
    const existing = prospect?.documents?.find((d) => d.docType === docType);
    return {
      docType,
      existingUrl: existing?.fileUrl,
      fileName: existing?.fileName,
    };
  });
}

interface ProspectFormProps {
  prospect?: Prospect;
  mode: "create" | "edit";
  successRedirect?: string;
}

export default function ProspectForm({
  prospect,
  mode,
  successRedirect,
}: ProspectFormProps) {
  const router = useRouter();
  const { data: courses } = useCourses();
  const { data: nextProspectId, isLoading: prospectIdLoading } =
    useNextProspectId(mode === "create");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const createMutation = useCreateProspect();
  const updateMutation = useUpdateProspect(prospect?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: prospect?.name ?? "",
      prospect_id: prospect?.prospectId ?? "",
      password: prospect?.password ?? "",
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
      payments:
        prospect?.payments?.map((p) => ({
          id: p.id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentType: p.paymentType,
          receiptUrl: p.receiptUrl,
          notes: p.notes,
        })) ?? [],
      documents: buildDocumentDefaults(prospect),
    },
  });

  useEffect(() => {
    if (mode === "create" && nextProspectId?.pospectId) {
      setValue("prospect_id", nextProspectId.pospectId);
    }
  }, [mode, nextProspectId?.pospectId, setValue]);

  const watchedPayments = watch("payments") ?? [];
  const estimatedValue = watch("estimatedValue") ?? 0;

  const { append, remove } = useFieldArray({
    control,
    name: "payments",
  });

  const handleAddPayment = (paymentData: PaymentFormValues) => {
    append({
      ...paymentData,
      id: `temp-${Date.now()}`,
      receiptUrl: null,
    });
  };

  const copyCredentials = async () => {
    const { prospect_id, password } = getValues();
    if (!prospect_id) {
      toast.error("Student ID not ready yet");
      return;
    }
    const text = `Student ID: ${prospect_id}\nPassword: ${password || "(not set)"}`;
    await navigator.clipboard.writeText(text);
    toast.success("Credentials copied");
  };

  const onSubmit = async (values: FormValues) => {
    const formData = new FormData();

    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("phone", values.phone);
    formData.append("fatherName", values.fatherName);
    formData.append("password", values.password || "");
    formData.append("prospect_id", values.prospect_id);
    formData.append("motherName", values.motherName);
    formData.append("dob", values.dob);
    formData.append("courseId", values.courseId);
    formData.append("specialization", values.specialization || "");
    formData.append("address", values.address);
    formData.append("deliveryAddress", values.deliveryAddress || "");
    formData.append("deliveryDate", values.deliveryDate || "");
    formData.append("estimatedValue", String(values.estimatedValue));
    formData.append("notes", values.notes || "");

    const paymentsForBackend = values.payments.map((p) => ({
      amount: p.amount,
      paymentType: p.paymentType,
      paymentDate: p.paymentDate,
      notes: p.notes,
      hasReceipt: !!p.receipt,
    }));
    formData.append("payments", JSON.stringify(paymentsForBackend));

    values.payments.forEach((p) => {
      if (p.receipt) {
        formData.append("paymentReceipts", p.receipt);
      }
    });

    values.documents.forEach((doc) => {
      if (doc.file) {
        formData.append("documents", doc.file);
        formData.append("docTypes", doc.docType);
      }
    });

    const defaultRedirect =
      mode === "create" ? "/employee/leads" : `/employee/leads/${prospect!.id}`;

    if (mode === "create") {
      createMutation.mutate(formData, {
        onSuccess: () => router.push(successRedirect ?? defaultRedirect),
      });
    } else {
      formData.append("replacePayments", "true");
      updateMutation.mutate(
        { id: prospect!.id, data: formData },
        {
          onSuccess: () =>
            router.push(successRedirect ?? defaultRedirect),
        },
      );
    }
  };

  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  const courseOptions =
    courses?.map((c) => ({ value: c.id, label: c.name })) ?? [];

  const displayProspectId =
    mode === "edit"
      ? prospect?.prospectId
      : prospectIdLoading
        ? "Generating…"
        : (nextProspectId?.pospectId ?? "—");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Card title="Personal information">
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Student ID
            </label>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
              {displayProspectId}
            </div>
          </div>

          <Input
            label="Password*"
            placeholder="$#*BDS^*!)"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex flex-col gap-1 justify-end items-start">
            <Button
              className="px-3 py-2 cursor-pointer text-black border-gray-700 dark:bg-gray-800"
              type="button"
              variant="secondary"
              onClick={copyCredentials}
            >
              Copy Credentials
            </Button>
          </div>
        </div>
      </Card>

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

      <Card title="Notes">
        <Textarea
          label="Notes / comments"
          placeholder="Any additional notes about this prospect…"
          className="min-h-[100px]"
          {...register("notes")}
        />
      </Card>

      <Card title="Documents">
        <DocumentUploader control={control} />
      </Card>

      <PaymentSummary
        payments={watchedPayments}
        estimatedValue={estimatedValue}
        onAddPayment={() => setPaymentModalOpen(true)}
        onRemovePayment={mode === "create" ? remove : undefined}
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleAddPayment}
      />

      <div className="flex items-start gap-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg text-xs text-primary-700 dark:text-primary-400">
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          Exam status and delivery can be updated from the leads list or detail
          page after the lead is saved. On save, this prospect syncs to the
          connected Google Sheet in the background.
        </span>
      </div>

      <div className="flex gap-3">
        <Button
          className="bg-gray-800 text-white dark:bg-gray-800"
          type="submit"
          variant="primary"
          isLoading={isPending}
        >
          {mode === "create" ? "Create prospect" : "Save changes"}
        </Button>
        <Button
          className="text-black border-gray-700 dark:bg-gray-800"
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
