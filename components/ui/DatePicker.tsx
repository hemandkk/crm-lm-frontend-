"use client";

import { format } from "date-fns";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import type { Matcher } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { startOfDay, endOfToday } from "date-fns";

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
  //const today = new Date();

  const startToday = startOfDay(new Date());
  const endToday = endOfToday();

  let disabled: Matcher | Matcher[] | undefined;

  if (mode === "past-only") {
    disabled = { after: endToday };
  } else if (mode === "future-only") {
    disabled = { before: startToday };
  } else if (allowPast === false && allowFuture === false) {
    disabled = [{ before: startToday }, { after: endToday }];
  } else if (allowPast === false) {
    disabled = { before: startToday };
  } else if (allowFuture === false) {
    disabled = { after: endToday };
  }

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
            {value ? format(value, "dd MMM yyyy") : <span>Select Date</span>}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
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
