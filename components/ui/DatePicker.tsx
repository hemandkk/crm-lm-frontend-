import { format } from "date-fns";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/caasl";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date?: Date) => void;
  error?: string;
  allowPast?: boolean;
  allowFuture?: boolean;

  startMonth?: Date;
  endMonth?: Date;
  mode?: DateMode;
}
type DateMode = "past-only" | "future-only" | "all";
export default function DatePicker({
  label,
  value,
  onChange,
  error,
  allowPast,
  allowFuture,
  startMonth,
  endMonth,
  mode,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const today = new Date();

  const disabled =
    allowPast === false || allowFuture === false
      ? {
          ...(allowPast === false ? { before: today } : {}),
          ...(allowFuture === false ? { after: today } : {}),
        }
      : undefined;

  const disabled1 =
    mode === "past-only"
      ? { after: today }
      : mode === "future-only"
        ? { before: today }
        : undefined;
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />

            {value ? format(value, "dd MMM yyyy") : <span>Select date</span>}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            //onSelect={onChange}
            onSelect={(date) => {
              onChange(date);
              setOpen(false); // close immediately
            }}
            captionLayout="dropdown"
            defaultMonth={value ?? new Date(2000, 0)}
            disabled={disabled}
            startMonth={startMonth}
            endMonth={endMonth}
          />
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
