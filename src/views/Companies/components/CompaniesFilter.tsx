import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import { Form, FormItem } from '@/components/ui/Form'
import { TbFilter } from 'react-icons/tb'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import { Select } from '@/components/ui'
import { statusOptions } from '@/constants/status.options.constant'
import { useCompaniesStore } from '../store/companiesStore'

const _statusOptions = [{ value: 'All', label: 'All' }, ...statusOptions]

type FormSchema = {
    companyName: string
    status: string
}

const validationSchema: ZodType<FormSchema> = z.object({
    companyName: z.string(),
    status: z.string(),
})

const CompaniesTableFilter = () => {
    const { filters, setFilters } = useCompaniesStore()
    const [dialogIsOpen, setIsOpen] = useState(false)

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        reset()
        setIsOpen(false)
    }

    const { handleSubmit, reset, control } = useForm<FormSchema>({
        defaultValues: filters,
        resolver: zodResolver(validationSchema),
    })

    const onSubmit = (values: FormSchema) => {
        setFilters(values)
        setIsOpen(false)
    }

    useEffect(() => {
        reset({
            ...filters,
        })
    }, [filters])

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
                    <FormItem label="Company Name">
                        <Controller
                            name="companyName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Search by company name"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem label="Status" className={'mb-4 col-span-2'}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={_statusOptions}
                                    placeholder="Status"
                                    {...field}
                                    value={
                                        _statusOptions.find(
                                            (option) =>
                                                option.value === field.value,
                                        ) || null
                                    }
                                    onChange={(option) =>
                                        field.onChange(option?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>

                    <div className="flex justify-end items-center gap-2 mt-4">
                        <Button
                            type="button"
                            onClick={() => {
                                reset()
                                setFilters({
                                    companyName: '',
                                    status: 'All',
                                })
                            }}
                        >
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

export default CompaniesTableFilter
