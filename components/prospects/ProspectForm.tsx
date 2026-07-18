"use client";
import { useCallback, useEffect, useState } from "react";
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
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthStore } from "@/store/authStore";
import { toMoneyNumber } from "@/lib/utils";
import type { DocType, PaymentFormValues, Prospect } from "@/types";

import "react-day-picker/style.css";
import DatePicker from "../ui/DatePicker";
import DocumentUploader from "../ui/DocumentUploader";
import PaymentSummary from "./PaymentSummary";
import PaymentModal from "../ui/PaymentModal";
import { generatePassword } from "@/lib/utils";
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
  // Empty = leave unchanged on edit / optional on create if backend generates
  password: z.union([
    z.literal(""),
    z.string().min(8, "Min 8 characters required."),
  ]),
  fatherName: z.string().min(1, "Father's name required"),
  motherName: z.string().min(1, "Mother's name required"),
  dob: z.string().min(1, "Date of birth is required"),
  courseId: z.string().min(1, "Course is required"),
  specialization: z.string().optional(),
  university: z.string().optional(),
  address: z.string().min(5, "Address required"),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.string().optional(),
  estimatedValue: z.preprocess(
    (v) => toMoneyNumber(v),
    z.number({ error: "Enter a valid amount" }).positive("Must be positive"),
  ),
  notes: z.string().optional(),
  /** Admin create: employee user id */
  assignedToId: z.string().optional(),
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
      amount: z.coerce.number().positive(),
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
    const existing = prospect?.documents?.find(
      (d) => d.document_type === docType,
    );
    return {
      docType,
      existingUrl: existing?.file_url,
      fileName: existing?.original_filename,
    };
  });
}

function buildDefaults(prospect?: Prospect): FormValues {
  return {
    name: prospect?.name ?? "",
    prospect_id: prospect?.prospectId ?? "",
    password: "",
    email: prospect?.email ?? "",
    phone: prospect?.phone ?? "",
    fatherName: prospect?.fatherName ?? "",
    motherName: prospect?.motherName ?? "",
    dob: prospect?.dob ? prospect.dob.slice(0, 10) : "",
    courseId: prospect?.courseId ? String(prospect.courseId) : "",
    specialization: prospect?.specialization ?? "",
    university: prospect?.university ?? "",
    address: prospect?.address ?? "",
    deliveryAddress: prospect?.deliveryAddress ?? "",
    deliveryDate: prospect?.deliveryDate
      ? String(prospect.deliveryDate).slice(0, 10)
      : "",
    estimatedValue:
      toMoneyNumber(prospect?.estimatedValue) > 0
        ? toMoneyNumber(prospect?.estimatedValue)
        : 0,
    notes: prospect?.notes ?? "",
    assignedToId: prospect?.assignedToId
      ? String(prospect.assignedToId)
      : "",
    payments:
      prospect?.payments?.map((p) => ({
        id: String(p.id),
        amount: Number(p.amount),
        paymentDate: String(p.paymentDate ?? "").slice(0, 10),
        paymentType: p.paymentType,
        receiptUrl: p.receiptUrl,
        notes: p.notes ?? "",
      })) ?? [],
    documents: buildDocumentDefaults(prospect),
  };
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
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin";
  const showAssignPicker = isAdmin && mode === "create";
  const prospectId = prospect?.id ? String(prospect.id) : "";
  const { data: courses } = useCourses();
  const { data: employeesData, isLoading: employeesLoading } = useEmployees({
    status: "active",
    pageSize: 200,
    enabled: showAssignPicker,
  });
  const { data: nextProspectId, isLoading: prospectIdLoading } =
    useNextProspectId(mode === "create");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const createMutation = useCreateProspect();
  const updateMutation = useUpdateProspect(prospectId);

  const generatePasswordFN = useCallback(generatePassword, []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    // zodResolver + coerce can widen input types; cast keeps RHF happy
    resolver: zodResolver(schema) as never,
    defaultValues: buildDefaults(prospect),
  });

  useEffect(() => {
    if (mode === "create") {
      const currentPassword = getValues("password");
      if (!currentPassword) {
        setValue("password", generatePasswordFN());
      }
    }
  }, [mode, setValue, getValues]);

  // Re-populate when prospect loads / changes (edit mode)
  useEffect(() => {
    if (mode === "edit" && prospect) {
      reset(buildDefaults(prospect));
    }
  }, [mode, prospect, reset]);

  useEffect(() => {
    if (mode === "create" && nextProspectId?.next_id) {
      setValue("prospect_id", nextProspectId.next_id);
    }
  }, [mode, nextProspectId?.next_id, setValue]);

  const watchedPayments = watch("payments") ?? [];
  const estimatedValue = toMoneyNumber(watch("estimatedValue"));

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
    const displayPassword =
      password || (mode === "edit" ? prospect?.password : "") || "(not set)";
    if (!prospect_id && !prospect?.prospectId) {
      toast.error("Student ID not ready yet");
      return;
    }
    const text = `Student ID: ${prospect_id || prospect?.prospectId}\nPassword: ${displayPassword}`;
    await navigator.clipboard.writeText(text);
    toast.success("Credentials copied");
  };

  const onInvalid = () => {
    const first = Object.values(errors)[0];
    const message =
      first && typeof first === "object" && "message" in first
        ? String(first.message)
        : "Please fix the highlighted fields";
    toast.error(message);
  };

  const onSubmit = async (values: FormValues) => {
    if (mode === "edit" && !prospectId) {
      toast.error("Missing prospect id");
      return;
    }

    if (showAssignPicker && !values.assignedToId) {
      toast.error("Please assign an employee");
      return;
    }

    const formData = new FormData();

    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("phone", values.phone);
    formData.append("fatherName", values.fatherName);
    formData.append("motherName", values.motherName);
    formData.append("dob", values.dob);
    formData.append(
      "prospect_id",
      values.prospect_id || prospect?.prospectId || "",
    );
    formData.append("courseId", values.courseId);
    formData.append("specialization", values.specialization || "");
    formData.append("university", values.university || "");
    formData.append("address", values.address);
    formData.append("deliveryAddress", values.deliveryAddress || "");
    formData.append("deliveryDate", values.deliveryDate || "");
    // Whole rupees only — avoids float noise (e.g. 5999.999 → "5999")
    formData.append(
      "estimatedValue",
      String(toMoneyNumber(values.estimatedValue)),
    );
    formData.append("notes", values.notes || "");

    if (showAssignPicker && values.assignedToId) {
      formData.append("assignedToId", values.assignedToId);
    }

    // Only send password when user typed a new one
    if (values.password) {
      formData.append("password", values.password);
    }

    const paymentsForBackend = values.payments.map((p) => ({
      id: p.id?.startsWith("temp-") ? undefined : p.id,
      amount: toMoneyNumber(p.amount),
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
        formData.append("document_type", doc.docType);
      }
    });

    const defaultRedirect =
      mode === "create" ? "/employee/leads" : `/employee/leads/${prospectId}`;

    if (mode === "create") {
      createMutation.mutate(formData, {
        onSuccess: () => router.push(successRedirect ?? defaultRedirect),
      });
      return;
    }

    formData.append("replacePayments", "true");
    updateMutation.mutate(
      { id: prospectId, data: formData },
      {
        onSuccess: () => router.push(successRedirect ?? defaultRedirect),
      },
    );
  };

  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  const courseOptions =
    courses?.map((c) => ({ value: String(c.id), label: c.name })) ?? [];

  const employees = employeesData?.items ?? employeesData?.data ?? [];
  const employeeOptions = employees.map((e) => ({
    value: String(e.id),
    label: e.employeeId ? `${e.name} (${e.employeeId})` : e.name,
  }));

  const displayProspectId =
    mode === "edit"
      ? prospect?.prospectId
      : prospectIdLoading
        ? "Generating…"
        : (nextProspectId?.next_id ?? "—");

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
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
            label={mode === "edit" ? "New password (optional)" : "Password*"}
            placeholder={
              mode === "edit" ? "Leave blank to keep current" : "$#*BDS^*!)"
            }
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
                label="Stream *"
                placeholder="Select Stream"
                options={courseOptions}
                error={errors.courseId?.message}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          />
          <Input
            label="Course"
            placeholder="e.g. AI & Machine Learning"
            {...register("specialization")}
          />
          <Input
            label="University"
            placeholder="Enter university name"
            {...register("university")}
          />
          <div className="col-span-full">
            <Input
              label="Deal value (₹) *"
              type="number"
              inputMode="numeric"
              step={1}
              min={1}
              placeholder="120000"
              error={errors.estimatedValue?.message}
              {...register("estimatedValue", {
                setValueAs: (v) => toMoneyNumber(v),
              })}
            />
          </div>
          {showAssignPicker && (
            <div className="col-span-full md:col-span-1">
              <Controller
                name="assignedToId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Assign to employee *"
                    placeholder={
                      employeesLoading ? "Loading…" : "Select employee"
                    }
                    options={employeeOptions}
                    error={errors.assignedToId?.message}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled={employeesLoading}
                  />
                )}
              />
            </div>
          )}
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
                label="Promised Delivery Date"
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
          label="Notes / comments / Additional Info"
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
        onRemovePayment={remove}
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handleAddPayment}
      />

      <div className="flex items-start gap-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg text-xs text-primary-700 dark:text-primary-400">
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          Exam status and delivery can be updated from the admissions list or detail
          page after the admission is saved. On save, this prospect syncs to the
          connected Google Sheet in the background.
        </span>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button
          className="text-black border-gray-700 dark:bg-gray-800 w-full sm:w-auto"
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          className="bg-gray-800 text-white dark:bg-gray-800 w-full sm:w-auto"
          type="submit"
          variant="primary"
          isLoading={isPending}
        >
          {mode === "create" ? "Create prospect" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
