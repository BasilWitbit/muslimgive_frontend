'use client'

import React, { FC, useState } from 'react'
import AvatarComponent from '@/components/common/AvatarComponent'
import { updateProfilePictureAction } from '@/app/actions/users'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

type IProps = {
    firstName: string;
    lastName: string;
    profilePicture?: string;
    editable?: boolean;
    sizePx?: number;
}

const ProfilePictureUpload: FC<IProps> = ({ firstName, lastName, profilePicture, editable = false, sizePx = 148 }) => {
    const [isUploading, setIsUploading] = useState(false)
    const [previewSource, setPreviewSource] = useState<string | null>(null)
    const router = useRouter()

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size too large. Max 5MB allowed.')
            return
        }

        const formData = new FormData()
        formData.append('file', file)

        // Create a local preview immediately
        const localUrl = URL.createObjectURL(file)

        setIsUploading(true)
        try {
            const res = await updateProfilePictureAction(formData)
            if (res.ok) {
                toast.success('Profile picture updated successfully')
                setPreviewSource(localUrl)
                router.refresh()
            } else {
                toast.error(res.message || 'Failed to update profile picture')
                URL.revokeObjectURL(localUrl)
            }
        } catch (error) {
            toast.error('An error occurred while uploading. Please try again.')
            URL.revokeObjectURL(localUrl)
        } finally {
            setIsUploading(false)
            // Reset input value
            if (event.target) event.target.value = ''
        }
    }

    return (
        <div className="relative group w-fit">
            <label
                htmlFor="profile-picture-upload"
                className={`relative rounded-full overflow-hidden block ${editable && !isUploading ? 'cursor-pointer' : ''}`}
            >
                <AvatarComponent
                    fallback={`${firstName ? firstName[0] : ''}${lastName ? lastName[0] : ''}`}
                    source={previewSource || profilePicture}
                    sizePx={sizePx}
                />

                {editable && (
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity pointer-events-none ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isUploading ? (
                            <Loader2 className="text-white animate-spin" style={{ width: sizePx * 0.22, height: sizePx * 0.22 }} />
                        ) : (
                            <Camera className="text-white" style={{ width: sizePx * 0.22, height: sizePx * 0.22 }} />
                        )}
                    </div>
                )}
            </label>

            {editable && (
                <input
                    id="profile-picture-upload"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                />
            )}
        </div>
    )
}

export default ProfilePictureUpload
