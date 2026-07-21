"use client";

import {
  Controller,
  useFieldArray,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import DatePicker from "../ui/DatePicker";
import { paymentTypeOptions } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue?: UseFormSetValue<any>;
}

export default function PaymentSection({ control, register, setValue }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "payments",
  });

  return (
    <Card title="Payments">
      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} title={`Payment #${index + 1}`}>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Amount"
                {...register(`payments.${index}.amount`, {
                  valueAsNumber: true,
                })}
              />

              <Controller
                name={`payments.${index}.paymentDate`}
                control={control}
                render={({ field: dateField }) => (
                  <DatePicker
                    label="Payment Date"
                    allowFuture
                    allowPast={false}
                    endMonth={new Date(new Date().getFullYear() + 10, 0)}
                    startMonth={new Date()}
                    value={
                      dateField.value ? new Date(dateField.value) : undefined
                    }
                    onChange={(date) =>
                      dateField.onChange(date ? format(date, "yyyy-MM-dd") : "")
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name={`payments.${index}.paymentType`}
                render={({ field: typeField }) => (
                  <Select
                    label="Payment Type"
                    options={[...paymentTypeOptions]}
                    {...typeField}
                  />
                )}
              />

              <Input
                type="file"
                label="Receipt"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (setValue) {
                    setValue(`payments.${index}.receipt`, file, {
                      shouldDirty: true,
                    });
                  }
                }}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  {...register(`payments.${index}.notes`)}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="danger"
                onClick={() => remove(index)}
              >
                Remove
              </Button>
            </div>
          </Card>
        ))}

        <Button
          type="button"
          onClick={() =>
            append({
              amount: 0,
              paymentDate: format(new Date(), "yyyy-MM-dd"),
              paymentType: fields.length === 0 ? "advance" : "installment",
              notes: "",
            })
          }
        >
          + Add Payment
        </Button>
      </div>
    </Card>
  );
}
