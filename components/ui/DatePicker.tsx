import { format } from "date-fns";
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
}

export default function DatePicker({
  label,
  value,
  onChange,
  error,
}: DatePickerProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}

      <Popover>
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
          <Calendar mode="single" selected={value} onSelect={onChange} />
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
