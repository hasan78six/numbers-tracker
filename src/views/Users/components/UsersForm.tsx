import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { Dialog, Select, toast } from '@/components/ui'
import { TbPlus, TbPencil } from 'react-icons/tb'
import { useUsersStore } from '../store/usersStore'
import { useUserTypesStore } from '@/store/userTypesStore'
import { UserType } from '../types'
import { statusOptions } from '@/constants/status.options.constant'
import { useSessionUser } from '@/store/authStore'

const UsersForm = ({
    isEdit,
    selectedRow,
}: {
    isEdit?: boolean
    selectedRow?: UserType
}) => {
    const companyId = useSessionUser((state) => state.user.company_id?.id || '')
    const companyUserTypeId = useUserTypesStore(
        (state) => state.companyUserTypeId,
    )

    const baseSchema = z.object({
        first_name: z.string().min(1, { message: 'Write at least 1 character' }).max(50, {
            message: 'First name is too long',
        }),
        last_name: z.string().min(1, { message: 'Write at least 1 character' }).max(50, {
            message: 'Last name is too long',
        }),
        status: z.string(),
    })

    const createSchema = baseSchema.extend({
        password: z.string().min(6, { message: 'Write at least 6 characters' }),
        email: z.string().email(),
    })

    type FormSchemaType = z.infer<typeof createSchema>

    const formSchema = isEdit ? baseSchema : createSchema

    const { addUser, updateLoading, updateUser } = useUsersStore()
    const {
        handleSubmit,
        reset,
        formState: { errors, isDirty, dirtyFields },
        control,
    } = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            status: '',
        },
    })
    const [dialogIsOpen, setIsOpen] = useState(false)

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        if (!updateLoading) {
            setIsOpen(false)
            reset()
        }
    }

    const onSubmit = async (values: FormSchemaType) => {
        if (isEdit && selectedRow) {
            const dirtyOnly = Object.keys(dirtyFields).reduce(
                (acc, key) => {
                    if (key === 'status') {
                        ;(acc as any)['is_active'] = values.status === 'Active'
                    } else {
                        acc[key as keyof FormSchemaType] =
                            values[key as keyof FormSchemaType]
                    }
                    return acc
                },
                {} as Partial<FormSchemaType> & { is_active?: boolean },
            )

            const result = await updateUser(selectedRow?.id || '', {
                ...dirtyOnly,
            })

            if (!result.success) {
                toast.notify(result.error || 'Failed to update user', 'danger')
            } else {
                toast.notify('User updated successfully', 'success')
                onDialogClose()
                reset()
            }
        } else {
            const result = await addUser({
                ...values,
                companyId,
                userTypeId: companyUserTypeId,
            })
            if (!result.success) {
                toast.notify(result.error || 'Failed to create user', 'danger')
            } else {
                toast.notify('User created successfully', 'success')
                onDialogClose()
                reset()
            }
        }
    }

    useEffect(() => {
        if (isEdit && selectedRow) {
            reset({
                first_name: selectedRow.first_name || '',
                last_name: selectedRow.last_name || '',
                email: '',
                password: '',
                status: selectedRow?.is_active ? 'Active' : 'Blocked',
            })
        }
    }, [selectedRow, reset])

    return (
        <>
            {isEdit ? (
                <div
                    className={`text-xl cursor-pointer select-none font-semibold hover:text-primary`}
                    role="button"
                    onClick={openDialog}
                >
                    <TbPencil />
                </div>
            ) : (
                <Button
                    variant="solid"
                    icon={<TbPlus className="text-xl" />}
                    onClick={openDialog}
                >
                    Create new User
                </Button>
            )}

            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <div className="p-6">
                    <h3 className="text-2xl font-semibold">
                        {isEdit ? 'Edit' : 'New'} User
                    </h3>
                    <div className="text-gray-500 mt-1">Enter user details</div>
                </div>
                <div className="p-6 pt-0">
                    <Form
                        containerClassName="grid grid-cols-2 gap-2 max-md:grid-cols-1"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <FormItem
                            label="First Name"
                            invalid={Boolean(errors.first_name)}
                            errorMessage={errors.first_name?.message}
                            className={errors.first_name ? 'mb-8' : 'mb-4'}
                        >
                            <Controller
                                name="first_name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Enter first name"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem
                            label="Last Name"
                            invalid={Boolean(errors.last_name)}
                            errorMessage={errors.last_name?.message}
                            className={errors.last_name ? 'mb-8' : 'mb-4'}
                        >
                            <Controller
                                name="last_name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Enter last name"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        {!isEdit && (
                            <FormItem
                                label="Email"
                                invalid={Boolean(errors.email)}
                                errorMessage={errors.email?.message}
                                className={`${errors.email ? 'mb-8' : 'mb-4'} col-span-2`}
                            >
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="email"
                                            autoComplete="off"
                                            placeholder="Enter email"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        )}

                        {!isEdit && (
                            <FormItem
                                label="Password"
                                invalid={Boolean(errors.password)}
                                errorMessage={errors.password?.message}
                                className={`${errors.password ? 'mb-8' : 'mb-4'} col-span-2`}
                            >
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field }) => (
                                        <Input
                                            type="password"
                                            autoComplete="off"
                                            placeholder="Enter password"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        )}

                        {isEdit && (
                            <FormItem
                                label="Status"
                                className={'mb-4 col-span-2'}
                            >
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            options={statusOptions}
                                            placeholder="Status"
                                            {...field}
                                            value={
                                                statusOptions.find(
                                                    (option) =>
                                                        option.value ===
                                                        field.value,
                                                ) || null
                                            }
                                            onChange={(option) =>
                                                field.onChange(option?.value)
                                            }
                                        />
                                    )}
                                />
                            </FormItem>
                        )}

                        <div className="col-span-2">
                            <Button
                                type="submit"
                                variant="solid"
                                className="w-full"
                                loading={updateLoading}
                                disabled={!isDirty}
                            >
                                {updateLoading ? 'Submitting...' : 'Submit'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </Dialog>
        </>
    )
}

export default UsersForm
