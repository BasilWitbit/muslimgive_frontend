'use client'
import React, { FC, useState, useEffect, useMemo } from 'react'
import ModelComponentWithExternalControl from '@/components/common/ModelComponent/ModelComponentWithExternalControl'
import { ControlledTextFieldComponent } from '@/components/common/TextFieldComponent/ControlledTextFieldComponent'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import CountrySelectComponent from '@/components/common/CountrySelectComponent'
import ConfirmActionModal from '@/components/common/ConfirmActionModal'
import { updateMeAction, UpdateMePayload } from '@/app/actions/users'
import { toast } from 'sonner'
import type { CountriesInKebab } from '@/components/common/CountrySelectComponent/countries.types'

type AddressInfo = {
    country: CountriesInKebab | ''
    postalCode: string
}

type IProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: AddressInfo
    onSave: (data: AddressInfo) => void
}

const EditAddressModal: FC<IProps> = ({ open, onOpenChange, initialData, onSave }) => {
    const [country, setCountry] = useState<AddressInfo['country']>('')
    const [postalCode, setPostalCode] = useState('')
    const [showConfirm, setShowConfirm] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [capturedInitial, setCapturedInitial] = useState<AddressInfo>({
        country: '',
        postalCode: ''
    })

    useEffect(() => {
        if (open) {
            setCountry(initialData.country)
            setPostalCode(initialData.postalCode)
            setCapturedInitial({ ...initialData })
        }
    }, [open, initialData])

    const hasChanges = useMemo(() => {
        return (
            country !== capturedInitial.country ||
            postalCode !== capturedInitial.postalCode
        )
    }, [country, postalCode, capturedInitial])

    const handleUpdate = () => {
        setShowConfirm(true)
    }

    const confirmUpdate = async () => {
        // Build payload with only changed fields (map country -> countryName for API)
        const changedPayload: UpdateMePayload = {}
        if (country !== capturedInitial.country) {
            changedPayload.countryName = country ? (country as CountriesInKebab) : null
        }
        if (postalCode !== capturedInitial.postalCode) changedPayload.postalCode = postalCode

        setIsUpdating(true)
        try {
            const res = await updateMeAction(changedPayload)
            if (res.ok) {
                toast.success('Address updated successfully')
                onSave({
                    country,
                    postalCode
                })
                onOpenChange(false)
            } else {
                toast.error(res.message || 'Failed to update address')
            }
        } catch (error) {
            console.error(error)
            toast.error('An error occurred while updating')
        } finally {
            setIsUpdating(false)
            setShowConfirm(false)
        }
    }

    const handleCancel = () => {
        setCountry(capturedInitial.country)
        setPostalCode(capturedInitial.postalCode)
        onOpenChange(false)
    }

    return (
        <>
            <ModelComponentWithExternalControl
                open={open}
                onOpenChange={onOpenChange}
                title="Edit Address"
                description="Update your address information"
                dialogContentClassName="sm:max-w-[600px]"
            >
                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <CountrySelectComponent
                            value={country || undefined}
                            onChange={setCountry}
                            placeholder="Select a country"
                        />
                    </div>

                    <ControlledTextFieldComponent
                        label="Postal Code (optional)"
                        placeholder="Enter postal code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                    />

                    <div className="flex flex-col gap-3 mt-2">
                        <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleUpdate}
                            disabled={!hasChanges}
                        >
                            Update Profile
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-primary text-primary bg-white hover:bg-blue-50"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </ModelComponentWithExternalControl>
            <ConfirmActionModal
                open={showConfirm}
                onOpenChange={setShowConfirm}
                onConfirm={confirmUpdate}
                title="Confirm Address Update"
                description="Are you sure you want to update your address information?"
                confirmText="Update"
                cancelText="Cancel"
                isLoading={isUpdating}
            />
        </>
    )
}

export default EditAddressModal
