import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import EligibilitySuggestionCard, { buildEligibilitySuggestion, type EligibilitySuggestionInput } from '@/components/common/EligibilitySuggestionCard'
import { updateCharityEligibilityAction } from '@/app/actions/charities'
import { toast } from 'sonner'

type IProps = {
    charityTitle: string
    charityId: string
    suggestionInput: EligibilitySuggestionInput
    initialDecision?: 'yes' | 'no' | ''
    initialIneligibilityReason?: string | null
    onUpdated: () => void
    onCancel: () => void
}

const EligibilityTest: React.FC<IProps> = ({
    charityTitle,
    charityId,
    suggestionInput,
    initialDecision = '',
    initialIneligibilityReason = '',
    onUpdated,
    onCancel,
}) => {
    const suggestion = useMemo(() => buildEligibilitySuggestion(suggestionInput), [suggestionInput])
    const [decision, setDecision] = useState<'yes' | 'no' | ''>(initialDecision)
    const [ineligibilityReason, setIneligibilityReason] = useState(initialIneligibilityReason ?? '')
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (!decision) {
            toast.error('Select Yes or No to complete the eligibility test.')
            return
        }
        if (decision === 'no' && !ineligibilityReason.trim()) {
            toast.error('Explain why this charity is ineligible.')
            return
        }
        setIsSaving(true)
        try {
            const res = await updateCharityEligibilityAction(charityId, {
                isEligible: decision === 'yes',
                ineligibilityReason: decision === 'no' ? ineligibilityReason.trim() : undefined,
            })
            if (res.ok) {
                toast.success('Eligibility test completed.')
                onUpdated()
            } else {
                toast.error(res.message || 'Failed to update eligibility.')
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
                {initialDecision === 'no' ? 'Update the eligibility decision for ' : 'Perform eligibility test for '}
                <span className="font-medium text-foreground">{charityTitle}</span>.
            </div>
            <EligibilitySuggestionCard suggestion={suggestion} />
            <div className="flex flex-col gap-2">
                <Label className="text-sm">Is this charity eligible?</Label>
                <RadioGroup value={decision} onValueChange={(val) => setDecision(val as 'yes' | 'no')}>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="eligibility-yes" />
                        <Label htmlFor="eligibility-yes">Yes (Mark eligible)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="eligibility-no" />
                        <Label htmlFor="eligibility-no">No (Mark ineligible)</Label>
                    </div>
                </RadioGroup>
            </div>
            {decision === 'no' ? (
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ineligibility-reason" className="text-sm">
                        Reason for ineligibility <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="ineligibility-reason"
                        value={ineligibilityReason}
                        onChange={(event) => setIneligibilityReason(event.target.value)}
                        placeholder="Explain which eligibility requirement was not met…"
                        className="min-h-[88px]"
                    />
                </div>
            ) : null}
            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                <Button variant="primary" type="button" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Eligibility'}
                </Button>
            </div>
        </div>
    )
}

export default EligibilityTest
