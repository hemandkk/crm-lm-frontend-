"use client";

import { Controller, useFieldArray } from "react-hook-form";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";

interface Props {
  control: any;
  register: any;
}

export default function PaymentSection({ control, register }: Props) {
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

              <Input
                type="date"
                label="Payment Date"
                {...register(`payments.${index}.paymentDate`)}
              />

              <Controller
                control={control}
                name={`payments.${index}.paymentType`}
                render={({ field }) => (
                  <Select
                    label="Payment Type"
                    options={[
                      {
                        value: "advance",
                        label: "Advance",
                      },
                      {
                        value: "installment",
                        label: "Installment",
                      },
                      {
                        value: "final",
                        label: "Final",
                      },
                    ]}
                    {...field}
                  />
                )}
              />

              <Input
                type="file"
                label="Receipt"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  field.receipt = file;
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
              paymentDate: new Date().toISOString().split("T")[0],
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
