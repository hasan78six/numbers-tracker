import { useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Form, FormItem } from '@/components/ui/Form'
import AvatarUpload from './AvatarUpload'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { Card, toast } from '@/components/ui'
import { useSessionUser } from '@/store/authStore'
import { apiUpdateUserProfile } from '@/services/AuthService'

type ProfileSchema = {
    firstName: string
    lastName: string
    email: string
}

const validationSchema = z.object({
    firstName: z.string().min(1, { message: 'First name is required' }),
    lastName: z.string().min(1, { message: 'Last name is required' }),
    email: z.string().email({ message: 'Invalid email format' }).optional(),
})

const ProfileSettings = () => {
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const { user, setUser } = useSessionUser()

    const defaultValues = {
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || 'john.doe@example.com',
    }

    const formRef = useRef<HTMLFormElement>(null)

    const {
        getValues,
        handleSubmit,
        formState: { errors, isDirty },
        control,
    } = useForm<ProfileSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues,
        mode: 'onChange',
    })

    const handlePostSubmit = async () => {
        setIsSubmitting(true)
        if (!user.id) {
            toast.notify('User not found', 'danger')
            return
        }
        try {
            const formData = getValues()
            await apiUpdateUserProfile(
                {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                },
                user.id,
            )
            setUser({
                ...user,
                first_name: formData.firstName,
                last_name: formData.lastName,
            })
            toast.notify(
                'Your profile has been updated successfully!',
                'success',
                'Profile updated',
            )
        } catch (error: unknown) {
            const err = error as Error
            toast.notify(
                err?.message || 'Failed to update profile. Please try again.',
                'danger',
                'Update failed',
            )
        } finally {
            setIsSubmitting(false)
            setConfirmationOpen(false)
        }
    }

    const onSubmit = async () => {
        setConfirmationOpen(true)
    }

    return (
        <Card className="p-4">
            <div className="mb-8">
                <h4>Profile Settings</h4>
                <p>Update your personal information and profile picture</p>
            </div>

            <Form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-6">
                    <AvatarUpload
                        initialImage={avatarUrl || user?.avatar_url as string}
                        onImageChange={setAvatarUrl}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6">
                    <FormItem
                        label="First Name"
                        invalid={Boolean(errors.firstName)}
                        errorMessage={errors.firstName?.message}
                    >
                        <Controller
                            name="firstName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    placeholder="Enter your first name"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Last Name"
                        invalid={Boolean(errors.lastName)}
                        errorMessage={errors.lastName?.message}
                    >
                        <Controller
                            name="lastName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    placeholder="Enter your last name"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>

                <FormItem label="Email" className="mb-6">
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                disabled
                                className="bg-gray-100"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <div className="flex justify-end">
                    <Button type="submit" variant="solid" disabled={!isDirty}>
                        Save Changes
                    </Button>
                </div>
            </Form>

            <ConfirmDialog
                isOpen={confirmationOpen}
                type="warning"
                title="Update profile information"
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handlePostSubmit,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>Are you sure you want to update your profile information?</p>
            </ConfirmDialog>
        </Card>
    )
}

export default ProfileSettings
