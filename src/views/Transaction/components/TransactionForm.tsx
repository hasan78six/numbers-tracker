import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { Dialog, Select, toast } from '@/components/ui'
import { TbPlus, TbPencil } from 'react-icons/tb'
import { Transaction } from '../types'
import { useTransactionStore } from '../store/transactionListStore'
import { useSessionUser } from '@/store/authStore'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import { getTodayDate } from '@/utils/formatDateTime'
import { useDropdownOptionsStore } from '@/store/dropdownOptionsStore'

const formSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters' })
        .max(50, {
            message: 'Name must be at most 50 characters',
        }),
    commission: z
        .string()
        .min(1, { message: 'Commission is required' })
        .refine((val) => !isNaN(Number(val)), {
            message: 'Commission must be a number',
        })
        .refine((val) => Number(val) >= 0.01, {
            message: 'Commission can not be less than 0.01',
        }),
    transaction_type_id: z.string({
        required_error: 'Transaction type is required',
    }),
    pending_date: z.date({
        required_error: 'Pending date is required',
    }),
})

type FormSchemaType = z.infer<typeof formSchema>

const TransactionForm = ({
    isEdit,
    selectedRow,
}: {
    isEdit?: boolean
    selectedRow?: Transaction
}) => {
    const [dialogIsOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user } = useSessionUser()

    const { addTransaction, updateTransaction } = useTransactionStore()
    const { statusOptions, transactionTypeOptions } = useDropdownOptionsStore()

    // Find the "pending" status ID from statusOptions
    const getPendingStatusId = (): string => {
        const pendingStatus = statusOptions.find(
            (option) => option.label.toLowerCase() === 'pending',
        )
        return pendingStatus?.value || ''
    }

    const {
        handleSubmit,
        reset,
        formState: { errors, isDirty, dirtyFields },
        control,
    } = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            commission: '',
            transaction_type_id: transactionTypeOptions?.[0]?.value || '',
            pending_date: getTodayDate(),
        },
    })

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        setIsOpen(false)
        reset()
    }

    const onSubmit = async (values: FormSchemaType) => {
        if (isEdit && selectedRow) {
            const dirtyOnly = Object.keys(dirtyFields).reduce((acc, key) => {
                if (key === 'pending_date') {
                    acc['pending_date' as keyof FormSchemaType] =
                        values.pending_date.toLocaleString() as any
                } else {
                    const typedKey = key as keyof FormSchemaType
                    acc[typedKey] = values[typedKey] as any
                }
                return acc
            }, {} as Partial<FormSchemaType>)

            const result = await updateTransaction(selectedRow?.id || '', {
                ...dirtyOnly,
                ...(dirtyOnly.commission
                    ? { commission: Number(dirtyOnly.commission) }
                    : { commission: selectedRow?.commission }),
            })
            if (!result.success) {
                toast.notify(
                    result.error || 'Failed to update transaction',
                    'danger',
                )
            } else {
                toast.notify('Transaction updated successfully', 'success')
                onDialogClose()
                reset()
            }
        } else {
            const result = await addTransaction({
                ...values,
                commission: Number(values.commission),
                status_id: getPendingStatusId(),
                user_id: user?.user_id || '',
            })
            if (!result.success) {
                toast.notify(
                    result.error || 'Failed to create transaction',
                    'danger',
                )
            } else {
                toast.notify('Transaction created successfully', 'success')
                onDialogClose()
                reset()
            }
        }
    }

    // Set form values when editing an existing transaction
    useEffect(() => {
        if (isEdit && selectedRow && dialogIsOpen) {
            reset({
                name: selectedRow.name || '',
                commission: String(selectedRow.commission || ''),
                transaction_type_id: selectedRow.transaction_types?.id || '',
                // Format the date for the input field - handle different possible formats
                pending_date: selectedRow.pending_date
                    ? new Date(selectedRow.pending_date)
                    : getTodayDate(),
            })
        }
    }, [isEdit, selectedRow, dialogIsOpen, reset])

    return (
        <>
            {isEdit ? (
                <div
                    className="text-xl cursor-pointer select-none font-semibold hover:text-primary"
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
                    Create new transaction
                </Button>
            )}

            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <div className="p-6">
                    <h3 className="text-2xl font-semibold">
                        {isEdit ? 'Edit' : 'New'} Transaction
                    </h3>
                    <div className="text-gray-500 mt-1">
                        Enter transaction details
                    </div>
                </div>
                <div className="p-6 pt-0">
                    <Form
                        className="flex w-full h-full"
                        containerClassName="flex flex-col w-full justify-between"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        {/* Name */}
                        <FormItem
                            label="Name"
                            invalid={!!errors.name}
                            errorMessage={errors.name?.message}
                        >
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        placeholder="Enter name"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Commission */}
                        <FormItem
                            label="Commission"
                            invalid={!!errors.commission}
                            errorMessage={errors.commission?.message}
                        >
                            <Controller
                                name="commission"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter commission"
                                        className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance:textfield]"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Pending Date */}
                        <FormItem
                            label="Pending Date"
                            invalid={!!errors.pending_date}
                            errorMessage={errors.pending_date?.message}
                        >
                            <Controller
                                name="pending_date"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        placeholder="Select pending date"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Transaction Type */}
                        <FormItem
                            label="Transaction Type"
                            invalid={!!errors.transaction_type_id}
                            errorMessage={errors.transaction_type_id?.message}
                        >
                            <Controller
                                name="transaction_type_id"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        options={transactionTypeOptions}
                                        value={
                                            transactionTypeOptions.find(
                                                (opt) =>
                                                    opt.value === field?.value,
                                            ) ?? null
                                        }
                                        onChange={(option) =>
                                            field.onChange(option?.value)
                                        }
                                    />
                                )}
                            />
                        </FormItem>

                        {/* Submit */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="solid"
                                className="w-full"
                                loading={isSubmitting}
                                disabled={!isDirty}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </Dialog>
        </>
    )
}

export default TransactionForm
