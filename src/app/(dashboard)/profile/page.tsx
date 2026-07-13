'use client'
import React, { useMemo, useState } from 'react'
import ProfilePageView from '@/components/use-case/ProfilePageComponent/ProfilePageView'
import UpdatePasswordModal from '@/components/use-case/ProfilePageComponent/UpdatePasswordModal'
import UpdateEmailModal from '@/components/use-case/ProfilePageComponent/UpdateEmailModal'
import EditPersonalInfoModal from '@/components/use-case/ProfilePageComponent/EditPersonalInfoModal'
import EditAddressModal from '@/components/use-case/ProfilePageComponent/EditAddressModal'
import type { CountriesInKebab } from '@/components/common/CountrySelectComponent/countries.types'
import type { Data, Role } from '@/components/use-case/UsersExpandableTable'
import { kebabToTitle, formatDateToYYYYMMDD } from '@/lib/helpers'
import { usePermissions } from '@/components/common/permissions-provider'
import type { UserProfile } from '@/app/lib/definitions'
import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'
import { useRouter } from 'next/navigation'

const mapMeToProfile = (u: UserProfile): Data => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    location: u.countryName || u.country || '-',
    postalCode: u.postalCode || '',
    roles: (u.roles || []).map(r => kebabToTitle(r) as Role),
    status: (u.isActive ? 'Active' : 'Inactive') as any,
    requestingPasswordReset: u.requestingPasswordReset,
    profilePicture: u.profilePicture,
})

const MyProfile = () => {
    const router = useRouter()
    const { me } = usePermissions()

    // State for modals
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
    const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false)
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

    // User data state
    const [profile, setProfile] = useState<Data | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    usePageNavigationDismiss(isLoading)

    const mappedProfile = useMemo(() => (me ? mapMeToProfile(me) : null), [me])

    React.useEffect(() => {
        if (!me) {
            setIsLoading(false)
            router.replace('/login?continue=/profile')
            return
        }
        setProfile(mappedProfile)
        setIsLoading(false)
    }, [me, mappedProfile, router])

    if (isLoading) return null
    if (!profile) return <div className="p-6">Profile not found.</div>

    return (
        <div className="flex h-full flex-col">
            <ProfilePageView
                {...profile}
                onEditPersonalInfo={() => setIsPersonalInfoModalOpen(true)}
                onEditAddress={() => setIsAddressModalOpen(true)}
                onChangePassword={() => setIsPasswordModalOpen(true)}
                onChangeEmail={() => setIsEmailModalOpen(true)}
            />

            {/* Modals */}
            <UpdatePasswordModal
                open={isPasswordModalOpen}
                onOpenChange={setIsPasswordModalOpen}
            />

            <UpdateEmailModal
                open={isEmailModalOpen}
                onOpenChange={setIsEmailModalOpen}
            />

            <EditPersonalInfoModal
                open={isPersonalInfoModalOpen}
                onOpenChange={setIsPersonalInfoModalOpen}
                initialData={{
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                }}
                onSave={(data) => {
                    setProfile(prev => prev ? {
                        ...prev,
                        firstName: data.firstName,
                        lastName: data.lastName,
                    } : null)
                }}
            />

            <EditAddressModal
                open={isAddressModalOpen}
                onOpenChange={setIsAddressModalOpen}
                initialData={{
                    country: profile.location !== '-' ? (profile.location.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") as CountriesInKebab) : '',
                    postalCode: profile.postalCode
                }}
                onSave={(data) => {
                    setProfile(prev => prev ? {
                        ...prev,
                        location: data.country || '-',
                        postalCode: data.postalCode
                    } : null)
                }}
            />
        </div>
    )
}

export default MyProfile
