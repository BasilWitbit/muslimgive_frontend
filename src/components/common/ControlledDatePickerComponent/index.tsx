"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
    value: Date | undefined;                      // controlled selected date
    onChange: (date: Date | undefined) => void;   // notify parent
    id?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    disabledFutureDates?: boolean;
    inputClassName?: string;

    // allow custom formatting and parsing for other locales or formats
    format?: (date: Date | undefined) => string;
    parse?: (text: string) => Date | undefined;
};

const defaultFormat = (date: Date | undefined) =>
    date
        ? date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
        : "";

const defaultParse = (text: string) => {
    const d = new Date(text);
    return isNaN(d.getTime()) ? undefined : d;
};

const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    id = "date",
    label,
    placeholder = "June 01, 2025",
    disabled,
    disabledFutureDates = false,
    inputClassName,
    format = defaultFormat,
    parse = defaultParse,
}) => {
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState<Date | undefined>(value);
    const [input, setInput] = React.useState<string>(format(value));
    const latestAllowedDate = React.useMemo(() => {
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
    }, []);

    // keep UI mirrors in sync when parent value changes
    React.useEffect(() => {
        setInput(format(value));
        setMonth(value);
    }, [value, format]);

    return (
        <div className="relative w-full flex">
            {label ? (
                <Label className="sr-only" htmlFor={id}>
                    {label}
                </Label>
            ) : null}

            <Input
                id={id}
                value={input}
                disabled={disabled}
                placeholder={placeholder}
                className={cn("w-full", inputClassName)}
                onChange={(e) => {
                    const text = e.target.value;
                    setInput(text);
                    const parsed = parse(text);
                    if (parsed) {
                        if (disabledFutureDates && parsed > latestAllowedDate) {
                            return;
                        }
                        onChange(parsed);
                        setMonth(parsed);
                    }
                }}
                onBlur={() => {
                    // snap back to canonical formatting
                    setInput(format(value));
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setOpen(true);
                    }
                }}
            />

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={`${id}-trigger`}
                        variant="ghost"
                        disabled={disabled}
                        className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                    >
                        <CalendarIcon className="size-3.5" />
                        <span className="sr-only">Select date</span>
                    </Button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
                >
                    <Calendar
                        mode="single"
                        selected={value}
                        captionLayout="dropdown"
                        month={month}
                        onMonthChange={setMonth}
                        disabled={disabledFutureDates ? { after: latestAllowedDate } : undefined}
                        onSelect={(d) => {
                            onChange(d);
                            setInput(format(d));
                            setOpen(false);
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DatePicker;
