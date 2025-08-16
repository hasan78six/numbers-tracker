import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { PiUpload, PiUserDuotone } from 'react-icons/pi'
import supabaseClient from '@/configs/supabase.config'
import { useSessionUser } from '@/store/authStore'
import { TbLoader2 } from 'react-icons/tb'
import { toast } from '@/components/ui'

interface AvatarUploadProps {
    initialImage: string | null
    onImageChange: (url: string | null) => void
}

const AvatarUpload = ({ initialImage, onImageChange }: AvatarUploadProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user, setUser } = useSessionUser()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const avatarFile = e.target.files?.[0]

        if (!avatarFile || !user?.id) {
            toast.notify('No file selected or user not found', 'danger')
            return
        }

        setIsUploading(true)

        try {
            // 0. Get the current avatar_url from the user's profile
            const { data: profileData, error: profileError } =
                await supabaseClient
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', user.id)
                    .single()

            if (profileError) {
                toast.notify(
                    profileError.message || 'Failed to fetch profile',
                    'danger',
                )
                setIsUploading(false)
                return
            }

            const previousAvatarUrl = profileData?.avatar_url

            // 1. Delete previous avatar from storage if exists
            if (previousAvatarUrl) {
                const match = previousAvatarUrl.match(/avatars\/(.+)$/)
                const objectPath = match?.[1]

                if (objectPath) {
                    await supabaseClient.storage
                        .from('avatars')
                        .remove([objectPath])
                } else {
                    toast.notify(
                        'Could not extract object path from URL',
                        'danger',
                    )
                }
            }

            // 2. Upload new avatar
            const filePath = `pitcures/${user.id}/${Date.now()}-${avatarFile.name}`
            const { data: uploadData, error: uploadError } =
                await supabaseClient.storage
                    .from('avatars')
                    .upload(filePath, avatarFile)

            if (uploadError || !uploadData) {
                toast.notify(uploadError?.message || 'Upload failed', 'danger')
                setIsUploading(false)
                return
            }

            // 3. Get public URL for the uploaded avatar
            const { data: publicUrlData } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(filePath)

            if (!publicUrlData?.publicUrl) {
                toast.notify('Failed to get public URL', 'danger')
                setIsUploading(false)
                return
            }

            const avatarUrl = publicUrlData.publicUrl

            // 4. Update user profile with new avatar URL
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ avatar_url: avatarUrl })
                .eq('id', user.id)

            if (updateError) {
                toast.notify(
                    updateError.message || 'Failed to update profile',
                    'danger',
                )
                setIsUploading(false)
                return
            }

            // 5. Update UI
            setPreviewUrl(avatarUrl)
            onImageChange(avatarUrl)
            setUser({ ...user, avatar_url: avatarUrl })
            toast.notify('Avatar updated successfully!', 'success')
        } catch (err) {
            const error = err as Error
            toast.notify(
                error?.message || 'Unexpected error while uploading avatar:',
                'danger',
            )
            setIsUploading(false)
        } finally {
            setIsUploading(false)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const avatarProps = {
        ...(previewUrl
            ? { src: previewUrl }
            : { icon: <PiUserDuotone size={48} /> }),
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <Avatar
                {...avatarProps}
                className={`h-24 w-24 cursor-pointer transition-all hover:opacity-90 border-1 border-primary-mild ${isUploading ? 'opacity-70' : ''}`}
                onClick={triggerFileInput}
            />

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="plain"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isUploading}
                    onClick={triggerFileInput}
                >
                    {isUploading ? (
                        <>
                            <TbLoader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <PiUpload className="h-4 w-4" />
                            {previewUrl ? 'Change' : 'Upload'} Avatar
                        </>
                    )}
                </Button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    )
}

export default AvatarUpload
