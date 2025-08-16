import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Checkbox from '@/components/ui/Checkbox'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { useTransactionStore } from '../store/transactionListStore'
import { TbFilter } from 'react-icons/tb'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'

type FormSchema = {
    name: string
    filterByStatus: Array<string>
    filterByTransactionType: Array<string>
}

const statusList = ['PENDING', 'CANCEL', 'CLOSED']
const transactionList = ['BUYER', 'LISTING']

const validationSchema: ZodType<FormSchema> = z.object({
    name: z.string(),
    filterByStatus: z.array(z.string()),
    filterByTransactionType: z.array(z.string()),
})

const TransactionListTableFilter = () => {
    const [dialogIsOpen, setIsOpen] = useState(false)

    const { filters, setFilters } = useTransactionStore()
    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        setIsOpen(false)
    }

    const { handleSubmit, reset, control } = useForm<FormSchema>({
        defaultValues: filters,
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = (values: FormSchema) => {
        setFilters({ ...values })
        setIsOpen(false)
    }

    return (
        <>
            <Button icon={<TbFilter />} onClick={() => openDialog()}>
                Filter
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">Filter</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormItem label="Transaction Name">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Search by transaction name"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Filter By Status">
                        <Controller
                            name="filterByStatus"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    className="flex mt-4"
                                    {...field}
                                >
                                    {statusList.map((source, index) => (
                                        <Checkbox
                                            key={source + index}
                                            name={field.name}
                                            value={source}
                                            className="justify-between flex-row-reverse heading-text"
                                        >
                                            {source.toUpperCase()}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </FormItem>
                    <FormItem label="Filter By Transaction Type">
                        <Controller
                            name="filterByTransactionType"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    className="flex mt-4"
                                    {...field}
                                >
                                    {transactionList.map((source, index) => (
                                        <Checkbox
                                            key={source + index}
                                            name={field.name}
                                            value={source}
                                            className="justify-between flex-row-reverse heading-text"
                                        >
                                            {source.toUpperCase()}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </FormItem>
                    <div className="flex justify-end items-center gap-2 mt-4">
                        <Button type="button" onClick={() => reset()}>
                            Reset
                        </Button>
                        <Button type="submit" variant="solid">
                            Apply
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}

export default TransactionListTableFilter
