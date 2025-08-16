import { useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Form, FormItem } from '@/components/ui/Form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import type { ZodType } from 'zod'
import { apiResetPassword, apiSignIn } from '@/services/AuthService'
import { Card, toast } from '@/components/ui'
import { useSessionUser } from '@/store/authStore'
import { HiEye, HiEyeOff } from 'react-icons/hi' // Import eye icons

type PasswordSchema = {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
}

const validationSchema: ZodType<PasswordSchema> = z
    .object({
        currentPassword: z
            .string()
            .min(1, { message: 'Please enter your current password!' }),
        newPassword: z
            .string()
            .min(1, { message: 'Please enter your new password!' }),
        confirmNewPassword: z
            .string()
            .min(1, { message: 'Please confirm your new password!' }),
    })
    .refine((data) => data.confirmNewPassword === data.newPassword, {
        message: 'Password not match',
        path: ['confirmNewPassword'],
    })

const SettingsSecurity = () => {
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { email } = useSessionUser((state) => state.user)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const formRef = useRef<HTMLFormElement>(null)

    const {
        getValues,
        reset,
        handleSubmit,
        formState: { errors, isValid },
        control,
        watch,
    } = useForm<PasswordSchema>({
        resolver: zodResolver(validationSchema),
        mode: 'onChange',
    })

    const watchAllFields = watch()
    const allFieldsFilled = Object.values(watchAllFields).every(
        (value) => value && value.trim() !== '',
    )
    const handleConfirm = async (
        curentPassword: string,
        newPassword: string,
    ) => {
        setIsSubmitting(true)
        try {
            // Step 1: Verify current password
            const verfiyCurrent = await apiSignIn({
                email: email as string,
                password: curentPassword,
            })

            if (!verfiyCurrent.token) {
                throw new Error('Current password is incorrect.')
            }
            // Step 2: Update password
            const resp = await apiResetPassword<boolean>({
                password: newPassword,
            })
            if (resp) {
                setIsSubmitting(false)
                reset()
                toast.notify(
                    'Password has been updated successfully!',
                    'success',
                )
            }
        } catch (error: unknown) {
            const err = error as Error
            toast.notify(
                typeof error === 'string'
                    ? error
                    : err?.message === 'Invalid login credentials'
                      ? 'Current password is incorrect.'
                      : 'Failed to update password',
                'danger',
                'Error',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePostSubmit = async () => {
        const { currentPassword, newPassword } = getValues()
        setIsSubmitting(true)
        await handleConfirm(currentPassword, newPassword)
        setConfirmationOpen(false)
        setIsSubmitting(false)
    }

    const onSubmit = async () => {
        setConfirmationOpen(true)
    }

    return (
        <Card className="p-4 h-fit">
            <div className="mb-8">
                <h4>Password</h4>
                <p>
                    Remember, your password is your digital key to your account.
                    Keep it safe, keep it secure!
                </p>
            </div>
            <Form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <FormItem
                    label="Current password"
                    invalid={Boolean(errors.currentPassword)}
                    errorMessage={errors.currentPassword?.message}
                >
                    <Controller
                        name="currentPassword"
                        control={control}
                        render={({ field }) => (
                            <div className="relative">
                                <Input
                                    type={
                                        showCurrentPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    autoComplete="off"
                                    placeholder="•••••••••"
                                    {...field}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() =>
                                        setShowCurrentPassword(
                                            !showCurrentPassword,
                                        )
                                    }
                                >
                                    {showCurrentPassword ? (
                                        <HiEyeOff />
                                    ) : (
                                        <HiEye />
                                    )}
                                </button>
                            </div>
                        )}
                    />
                </FormItem>
                <FormItem
                    label="New password"
                    invalid={Boolean(errors.newPassword)}
                    errorMessage={errors.newPassword?.message}
                >
                    <Controller
                        name="newPassword"
                        control={control}
                        render={({ field }) => (
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? 'text' : 'password'}
                                    autoComplete="off"
                                    placeholder="•••••••••"
                                    {...field}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() =>
                                        setShowNewPassword(!showNewPassword)
                                    }
                                >
                                    {showNewPassword ? <HiEyeOff /> : <HiEye />}
                                </button>
                            </div>
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Confirm new password"
                    invalid={Boolean(errors.confirmNewPassword)}
                    errorMessage={errors.confirmNewPassword?.message}
                >
                    <Controller
                        name="confirmNewPassword"
                        control={control}
                        render={({ field }) => (
                            <div className="relative">
                                <Input
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    autoComplete="off"
                                    placeholder="•••••••••"
                                    {...field}
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <HiEyeOff />
                                    ) : (
                                        <HiEye />
                                    )}
                                </button>
                            </div>
                        )}
                    />
                </FormItem>
                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        type="submit"
                        disabled={!allFieldsFilled || !isValid || isSubmitting}
                    >
                        Update Password
                    </Button>
                </div>
            </Form>
            <ConfirmDialog
                isOpen={confirmationOpen}
                type="warning"
                title="Update password"
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handlePostSubmit,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>Are you sure you want to change your password?</p>
            </ConfirmDialog>
        </Card>
    )
}

export default SettingsSecurity
