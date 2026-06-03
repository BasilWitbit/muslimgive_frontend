"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type AutoCompleteOption = {
    value: string
    label: string
    hint?: string
}

export type AutoCompleteComponentProps = {
    options: AutoCompleteOption[]
    value?: string | null
    defaultValue?: string | null
    onValueChange?: (value: string | null, option?: AutoCompleteOption | null) => void
    placeholder?: string
    inputPlaceholder?: string
    emptyMessage?: string
    disabled?: boolean
    className?: string
    triggerClassName?: string
    contentClassName?: string
    inputClassName?: string
    onSearchChange?: (value: string) => void
}

export function AutoCompleteComponent({
    options,
    value,
    defaultValue = null,
    onValueChange,
    placeholder = "Select an option...",
    inputPlaceholder = "Search...",
    emptyMessage = "No results found.",
    disabled = false,
    className,
    triggerClassName,
    contentClassName,
    inputClassName,
    onSearchChange,
}: AutoCompleteComponentProps) {
    const [open, setOpen] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState<string | null>(defaultValue)

    const selectedValue = value !== undefined ? value : internalValue
    const selectedOption = options.find((option) => option.value === selectedValue) || null

    const handleSelect = (currentValue: string) => {
        const nextValue = currentValue === selectedValue ? null : currentValue

        if (value === undefined) {
            setInternalValue(nextValue)
        }

        onValueChange?.(nextValue, options.find((option) => option.value === nextValue) || null)
        setOpen(false)
    }

    return (
        <div className={cn("w-full", className)}>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between", triggerClassName)}
                        disabled={disabled}
                    >
                        {selectedOption?.label ?? placeholder}
                        <ChevronsUpDown className="opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent 
                    className={cn("w-full p-0", contentClassName)}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    <Command shouldFilter={!onSearchChange}>
                        {/* If onSearchChange is provided, we disable default client-side filtering with shouldFilter={false} */}
                        <CommandInput
                            placeholder={inputPlaceholder}
                            className={cn("h-9", inputClassName)}
                            disabled={disabled}
                            onValueChange={onSearchChange}
                        />
                        <CommandList>
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={handleSelect}
                                        disabled={disabled}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span>{option.label}</span>
                                            {option.hint ? (
                                                <span className="text-xs text-muted-foreground">{option.hint}</span>
                                            ) : null}
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-auto",
                                                selectedValue === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
