import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { Dialog, Select, toast } from '@/components/ui'
import { TbPlus, TbPencil } from 'react-icons/tb'
import { useCompaniesStore } from '../store/companiesStore'
import { useUserTypesStore } from '@/store/userTypesStore'
import { CompanyType } from '../types'
import { statusOptions } from '@/constants/status.options.constant'

const usPhoneRegex = /^(\+1\s?)?(\()?(\d{3})(\))?[-.\s]?(\d{3})[-.\s]?(\d{4})$/

const CompaniesForm = ({
    isEdit,
    selectedRow,
}: {
    isEdit?: boolean
    selectedRow?: CompanyType
}) => {
    const baseSchema = z.object({
        companyName: z
            .string()
            .min(2, { message: 'Write at least 2 characters' })
            .max(50, { message: 'Company name is too long' }),
        companyAddress: z
            .string()
            .min(10, {
                message: 'Write at least 10 characters',
            })
            .max(100, {
                message: 'Company address is too long',
            }),
        companyContactNumber: z.string().regex(usPhoneRegex, {
            message: 'Enter a valid US phone number',
        }),
        firstName: z
            .string()
            .min(1, { message: 'Write at least 1 character' })
            .max(50, {
                message: 'First name is too long',
            }),
        lastName: z
            .string()
            .min(1, { message: 'Write at least 1 character' })
            .max(50, {
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

    const companyTypeId = useUserTypesStore((state) => state.companyTypeId)
    const { addCompany, updateLoading, updateCompany } = useCompaniesStore()
    const {
        handleSubmit,
        reset,
        formState: { errors, isDirty, dirtyFields },
        control,
    } = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: '',
            companyAddress: '',
            companyContactNumber: '',
            firstName: '',
            lastName: '',
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

            const result = await updateCompany(
                selectedRow?.id || '',
                selectedRow?.companyId,
                { ...dirtyOnly },
            )
            if (!result.success) {
                toast.notify(
                    result.error || 'Failed to update company',
                    'danger',
                )
            } else {
                toast.notify('Company updated successfully', 'success')
                onDialogClose()
                reset()
            }
        } else {
            const result = await addCompany({
                ...values,
                companyTypeId,
            })
            if (!result.success) {
                toast.notify(
                    result.error || 'Failed to create company',
                    'danger',
                )
            } else {
                toast.notify('Company created successfully', 'success')
                onDialogClose()
                reset()
            }
        }
    }

    useEffect(() => {
        if (isEdit && selectedRow) {
            reset({
                companyName: selectedRow.companyName || '',
                companyAddress: selectedRow.companyAddress || '',
                companyContactNumber: selectedRow.companyContactNumber || '',
                firstName: selectedRow.firstName || '',
                lastName: selectedRow.lastName || '',
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
                    Create new company
                </Button>
            )}

            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <div className="p-6">
                    <h3 className="text-2xl font-semibold">
                        {isEdit ? 'Edit' : 'New'} Company
                    </h3>
                    <div className="text-gray-500 mt-1">
                        Enter company details
                    </div>
                </div>
                <div className="p-6 pt-0">
                    <Form
                        containerClassName="grid grid-cols-2 gap-2 max-md:grid-cols-1"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <FormItem
                            label="Company Name"
                            invalid={Boolean(errors.companyName)}
                            errorMessage={errors.companyName?.message}
                            className={errors.companyName ? 'mb-8' : 'mb-4'}
                        >
                            <Controller
                                name="companyName"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Enter company name"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Company Phone"
                            invalid={Boolean(errors.companyContactNumber)}
                            errorMessage={errors.companyContactNumber?.message}
                            className={
                                errors.companyContactNumber ? 'mb-8' : 'mb-4'
                            }
                        >
                            <Controller
                                name="companyContactNumber"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Enter company phone"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem
                            label="Representative First Name"
                            invalid={Boolean(errors.firstName)}
                            errorMessage={errors.firstName?.message}
                            className={errors.firstName ? 'mb-8' : 'mb-4'}
                        >
                            <Controller
                                name="firstName"
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
                            label="Representative Last Name"
                            invalid={Boolean(errors.lastName)}
                            errorMessage={errors.lastName?.message}
                            className={errors.lastName ? 'mb-8' : 'mb-4'}
                        >
                            <Controller
                                name="lastName"
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
                                            autoComplete="new-email"
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
                                            autoComplete="new-password"
                                            placeholder="Enter password"
                                            {...field}
                                        />
                                    )}
                                />
                            </FormItem>
                        )}

                        <FormItem
                            label="Company Address"
                            invalid={Boolean(errors.companyAddress)}
                            errorMessage={errors.companyAddress?.message}
                            className={`${errors.companyAddress ? 'mb-8' : 'mb-4'} col-span-2`}
                        >
                            <Controller
                                name="companyAddress"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Enter company address"
                                        {...field}
                                        className="scrollbar-hide"
                                        textArea
                                    />
                                )}
                            />
                        </FormItem>

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

export default CompaniesForm
