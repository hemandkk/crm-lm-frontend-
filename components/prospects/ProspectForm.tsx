"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Input, Select, Textarea, Button, Card } from "@/components/ui";
import { useCreateProspect, useUpdateProspect } from "@/hooks/useProspects";
import { useCourses } from "@/hooks";
import type { Prospect } from "@/types";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import DatePicker from "../ui/DatePicker";
import DocumentUploader from "../ui/DocumentUploader";
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
  payments: z.array(
    z.object({
      amount: z.number().positive(),
      paymentDate: z.string(),
      paymentType: z.enum(["advance", "installment", "final"]),
      receipt: z.any().optional(),
      notes: z.string().optional(),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

interface ProspectFormProps {
  prospect?: Prospect;
  mode: "create" | "edit";
}

export default function ProspectForm({ prospect, mode }: ProspectFormProps) {
  const router = useRouter();
  const { data: courses } = useCourses();

  const createMutation = useCreateProspect();
  const updateMutation = useUpdateProspect(prospect?.id ?? "");

  const {
    register,
    control,
    handleSubmit,
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
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "payments",
  });
  const onSubmit = (values: FormValues) => {
    if (mode === "create") {
      createMutation.mutate(values, {
        onSuccess: () => router.push("/employee/leads"),
      });
    } else {
      updateMutation.mutate(values, {
        onSuccess: () => router.push(`/employee/leads/${prospect!.id}`),
      });
    }
  };

  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  const courseOptions =
    courses?.map((c) => ({ value: c.id, label: c.name })) ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Personal info */}
      <Card title="Personal information">
        {" "}
        DOB , certs upload section aadh, pp photo, sslc, +2, degre, agreement,
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
          <Input
            label="Delivery date"
            type="date"
            {...register("deliveryDate")}
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
        <DocumentUploader value="aadhaar" onChange={() => {}} />
      </Card>
      <Card title={`Payment ${1}`}>
        <Button
          type="button"
          onClick={() =>
            append({
              amount: 0,
              paymentDate: "",
              paymentType: "advance",
              notes: "",
            })
          }
        >
          + Add Payment
        </Button>
      </Card>
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
        <Button type="submit" variant="primary" isLoading={isPending}>
          {mode === "create" ? "Create prospect" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
