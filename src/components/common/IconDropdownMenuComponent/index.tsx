import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

type Option = {
    value: string,
    label: React.ReactNode
}

type IProps = {
    icon?: React.ReactNode,
    options: Option[],
    onSelect?: (selection: string) => void;
    className?: string
    variant?: 'default' | 'premium'
    destructiveValues?: string[]
}

const IconDropdownMenuComponent: React.FC<IProps> = ({
    className,
    icon,
    options,
    onSelect,
    variant = 'default',
    destructiveValues = [],
}) => {
    const isPremium = variant === 'premium'
    const destructiveSet = new Set(destructiveValues)
    const regularOptions = options.filter((opt) => !destructiveSet.has(opt.value))
    const destructiveOptions = options.filter((opt) => destructiveSet.has(opt.value))

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        isPremium
                            ? 'h-10 w-10 rounded-xl border border-[#E8EEF5] bg-white text-[#667085] shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition-all hover:border-[#D9E8FB] hover:bg-[#F8FBFF] hover:text-[#266DD3] data-[state=open]:border-[#BFD7F8] data-[state=open]:bg-[#F8FBFF] data-[state=open]:text-[#266DD3]'
                            : undefined,
                        className,
                    )}
                >
                    {icon ?? <MoreVertical className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className={cn(
                    isPremium
                        ? 'min-w-[15rem] rounded-2xl border border-[#E8EEF5] bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm'
                        : undefined,
                )}
            >
                {regularOptions.map((eachOpt) => (
                    <DropdownMenuItem
                        key={eachOpt.value}
                        className={cn(
                            isPremium
                                ? 'cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-[#344054] focus:bg-[#F8FBFF] focus:text-[#101928]'
                                : undefined,
                        )}
                        onClick={() => onSelect?.(eachOpt.value)}
                    >
                        {eachOpt.label}
                    </DropdownMenuItem>
                ))}
                {isPremium && destructiveOptions.length > 0 && regularOptions.length > 0 ? (
                    <DropdownMenuSeparator className="my-1 bg-[#EEF2F6]" />
                ) : null}
                {destructiveOptions.map((eachOpt) => (
                    <DropdownMenuItem
                        key={eachOpt.value}
                        variant={isPremium ? undefined : 'destructive'}
                        className={cn(
                            isPremium
                                ? 'cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700'
                                : undefined,
                        )}
                        onClick={() => onSelect?.(eachOpt.value)}
                    >
                        {eachOpt.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
};

export default IconDropdownMenuComponent;
