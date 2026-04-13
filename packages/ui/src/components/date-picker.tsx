import * as React from "react"
import { Calendar } from "@v1_peluqueria/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@v1_peluqueria/ui/components/popover"
import { Button } from "@v1_peluqueria/ui/components/button"
import { CalendarIcon } from "lucide-react"
import { cn } from "@v1_peluqueria/ui/lib/utils"

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  disabled?: (date: Date) => boolean
  placeholder?: string
  className?: string
}

function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  placeholder = "Seleccionar fecha",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
    if (date) setOpen(false)
  }

  const defaultDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value
            ? value.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={disabled || defaultDisabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }