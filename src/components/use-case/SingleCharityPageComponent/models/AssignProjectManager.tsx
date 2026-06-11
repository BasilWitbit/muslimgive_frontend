import * as React from "react"
import { AutoCompleteComponent, AutoCompleteOption } from "@/components/common/AutoCompleteComponent"
import { Label } from "@/components/ui/label"
import { TypographyComponent } from "@/components/common/TypographyComponent"
import { Button } from "@/components/ui/button"
import AvatarComponent from "@/components/common/AvatarComponent"

type IProps = {
    onSelection: (ids: string[]) => void;
    onCancel?: () => void;
    roleLabel?: string;
    actionLabel?: string;
    isSubmitting?: boolean;
    users: Array<{ id: string; name: string; email?: string | null }>;
    initialSelectedIds?: string[];
}

const AssignProjectManager: React.FC<IProps> = ({
    onSelection,
    onCancel,
    roleLabel = 'project manager',
    actionLabel = 'Assign',
    isSubmitting = false,
    users,
    initialSelectedIds = [],
}) => {
    const [selectedManagers, setSelectedManagers] = React.useState<string[]>(initialSelectedIds)
    const [searchQuery, setSearchQuery] = React.useState("")
    const options = React.useMemo<AutoCompleteOption[]>(() => {
        const lower = searchQuery.trim().toLowerCase()
        return users
            .filter(u => {
                if (!lower) return true
                return u.name.toLowerCase().includes(lower) || (u.email ?? '').toLowerCase().includes(lower)
            })
            .map(u => ({
                value: u.id,
                label: u.name,
                hint: u.email ?? undefined,
            }))
    }, [users, searchQuery])

    const selectedUserOptions = options.filter(opt => selectedManagers.includes(opt.value))

    const handleSelect = (val: string | null) => {
        if (!val) return
        if (!selectedManagers.includes(val)) {
            setSelectedManagers([...selectedManagers, val])
        }
    }

    const handleRemove = (val: string) => {
        setSelectedManagers(selectedManagers.filter(id => id !== val))
    }

    return (
        <div className="max-w-md flex flex-col gap-4">
            <Label className="text-sm font-medium">{`Assign ${roleLabel}s`}</Label>
            <AutoCompleteComponent
                options={options.filter(opt => !selectedManagers.includes(opt.value))}
                value={null}
                onValueChange={handleSelect}
                placeholder={`Search ${roleLabel}s to add...`}
                inputPlaceholder="Type a name or email"
                emptyMessage={`No ${roleLabel}s found.`}
                onSearchChange={setSearchQuery}
            />
            {selectedManagers.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                    {selectedUserOptions.map(opt => (
                        <div key={opt.value} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center gap-3">
                                <AvatarComponent fallback={opt.label.charAt(0)} sizePx={40} className="w-10 h-10" />
                                <div className="flex flex-col">
                                    <TypographyComponent className="text-gray-900 font-medium">{opt.label}</TypographyComponent>
                                    <TypographyComponent className="text-gray-600 text-xs">
                                        {opt.hint}
                                    </TypographyComponent>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleRemove(opt.value)}>
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <TypographyComponent className="text-gray-800 text-xs">{`Please select at least one ${roleLabel}.`}</TypographyComponent>
            )}
            <Button className="w-full" variant={"primary"} loading={isSubmitting} disabled={selectedManagers.length === 0 || isSubmitting} onClick={() => {
                onSelection(selectedManagers)
            }}>{actionLabel}</Button>
            <Button className="w-full" variant={"outline"} disabled={isSubmitting} onClick={onCancel}>Cancel</Button>
        </div>
    )
}

export default AssignProjectManager
