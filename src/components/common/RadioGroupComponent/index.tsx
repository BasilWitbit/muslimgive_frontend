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

        const layoutClass = direction === "horizontal" ? "flex-row flex-wrap gap-4" : "flex-col gap-3";

        return (
            <div className={cn('flex flex-col gap-2', className)} ref={ref}>
                {label ? (
                    <TypographyComponent className={cn(labelClassNames)}>
                        <strong>
                            {label}
                            {required ? <span className="text-red-500">*</span> : null}
                        </strong>
                    </TypographyComponent>
                ) : null}

                <RadioGroup
                    name={name}
                    value={value !== undefined ? String(value) : undefined}
                    onValueChange={onChange}
                    className={`flex ${layoutClass}`}
                    aria-invalid={!!error}
                    aria-describedby={helpId}
                    disabled={disabled}
                >
                    {options.map((eachOption, index) => {
                        const itemId = `${baseId}-opt-${index}`;
                        const isSelected = value !== undefined && String(value) === eachOption.value;
                        return (
                            <div
                                key={eachOption.value}
                                className={cn(
                                    'flex items-start gap-3 cursor-pointer rounded-md border p-3 transition-colors',
                                    eachOption.description
                                        ? isSelected
                                            ? 'border-[#266dd3]/40 bg-white shadow-sm'
                                            : 'border-gray-200 hover:bg-gray-50'
                                        : 'border-transparent p-0',
                                )}
                            >
                                <RadioGroupItem
                                    value={eachOption.value}
                                    id={itemId}
                                    disabled={disabled || eachOption.disabled}
                                    className="mt-0.5"
                                />
                                <Label htmlFor={itemId} className="cursor-pointer flex flex-col gap-1 w-full font-normal">
                                    <span className="font-medium text-sm text-[#101928]">{eachOption.label}</span>
                                    {eachOption.description ? (
                                        <span className="text-xs text-[#667085] font-normal leading-snug">
                                            {eachOption.description}
                                        </span>
                                    ) : null}
                                </Label>
                            </div>
                        );
                    })}
                </RadioGroup>

                {error ? (
                    <p id={errId} className="text-sm text-red-600 mt-1">
                        {error}
                    </p>
                ) : description ? (
                    <p id={descId} className="text-sm text-muted-foreground mt-1">
                        {description}
                    </p>
                ) : null}
            </div>
        );
    }
);

RadioGroupComponent.displayName = "RadioGroupComponent";

export default RadioGroupComponent;

/*
Usage example:

<RadioGroupControlled
  label="Notification preference"
  required
  options={[
    { label: "Email", value: "email" },
    { label: "SMS", value: "sms" },
    { label: "Push", value: "push", disabled: true },
  ]}
  value={pref}
  onChange={setPref}
  name="notif-pref"
  description="Choose how you want to be contacted"
  error={formError}
  direction="horizontal"
/>
*/
