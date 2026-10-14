"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TypographyComponent } from "../TypographyComponent";
import { cn } from "@/lib/utils";

export type RadioOption = {
    label: string;
    value: string;
    disabled?: boolean;
    /** Optional descriptor shown under the option label */
    description?: string;
};

export type RadioGroupControlledProps = {
    label?: string;
    required?: boolean;
    options: RadioOption[];
    /** Current selected value */
    value: string | number | boolean | undefined;
    /** Change handler, receives the next value */
    onChange: (value: string) => void;
    /** Optional name for native grouping */
    name?: string;
    /** Disable the whole group */
    disabled?: boolean;
    /** Optional help text shown under the group */
    description?: string;
    /** Optional error text, takes precedence over description for aria-describedby */
    error?: string;
    /** Layout direction for the radio items */
    direction?: "vertical" | "horizontal";
    /** Pass through className to the container */
    className?: string;
    /** Pass through id prefix, used to link labels and help text */
    idPrefix?: string;
    labelClassNames?: string;
};

const RadioGroupComponent = React.forwardRef<HTMLDivElement, RadioGroupControlledProps>(
    (
        {
            label,
            labelClassNames,
            required = false,
            options,
            value,
            onChange,
            name,
            disabled = false,
            description,
            error,
            direction = "vertical",
            className,
            idPrefix,
        },
        ref
    ) => {
        const reactId = React.useId();
        const baseId = idPrefix ?? `rg-${reactId}`;
        const descId = description ? `${baseId}-desc` : undefined;
        const errId = error ? `${baseId}-err` : undefined;
        const helpId = error ? errId : descId;

        const hasDescriptions = options.some((opt) => Boolean(opt.description));
        const layoutClass =
            direction === "horizontal"
                ? "flex-row flex-wrap gap-2.5"
                : "flex-col gap-2";

        return (
            <div className={cn("flex w-full flex-col items-stretch gap-3 text-left", className)} ref={ref}>
                {label ? (
                    <TypographyComponent className={cn("text-left text-[15px] font-semibold text-[#101928]", labelClassNames)}>
                        {label}
                        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
                    </TypographyComponent>
                ) : null}

                <RadioGroup
                    name={name}
                    value={value !== undefined ? String(value) : undefined}
                    onValueChange={onChange}
                    className={cn("!flex w-full items-stretch", layoutClass)}
                    aria-invalid={!!error}
                    aria-describedby={helpId}
                    disabled={disabled}
                >
                    {options.map((eachOption, index) => {
                        const itemId = `${baseId}-opt-${index}`;
                        const isSelected = value !== undefined && String(value) === eachOption.value;
                        return (
                            <Label
                                key={eachOption.value}
                                htmlFor={itemId}
                                className={cn(
                                    "flex w-full cursor-pointer items-start justify-start gap-3 text-left font-normal",
                                    hasDescriptions
                                        ? cn(
                                              "rounded-xl border p-3.5 transition-colors",
                                              isSelected
                                                  ? "border-[#266dd3]/45 bg-[#F7FAFF] shadow-[0_1px_2px_rgba(38,109,211,0.08)]"
                                                  : "border-[#E8EEF5] bg-white hover:border-[#D0D5DD] hover:bg-[#FAFBFC]",
                                          )
                                        : cn(
                                              "rounded-lg px-1 py-2 transition-colors",
                                              isSelected ? "bg-[#F7FAFF]" : "hover:bg-[#FAFBFC]",
                                          ),
                                    (disabled || eachOption.disabled) && "cursor-not-allowed opacity-50",
                                )}
                            >
                                <RadioGroupItem
                                    value={eachOption.value}
                                    id={itemId}
                                    disabled={disabled || eachOption.disabled}
                                    className="mt-0.5 shrink-0"
                                />
                                <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
                                    <span className="text-sm font-medium leading-snug text-[#101928]">
                                        {eachOption.label}
                                    </span>
                                    {eachOption.description ? (
                                        <span className="text-xs font-normal leading-snug text-[#667085]">
                                            {eachOption.description}
                                        </span>
                                    ) : null}
                                </span>
                            </Label>
                        );
                    })}
                </RadioGroup>

                {error ? (
                    <p id={errId} className="mt-1 text-left text-sm text-red-600">
                        {error}
                    </p>
                ) : description ? (
                    <p id={descId} className="mt-1 text-left text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
        );
    }
);

RadioGroupComponent.displayName = "RadioGroupComponent";

export default RadioGroupComponent;
