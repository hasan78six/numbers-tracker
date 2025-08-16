import { useCallback, useState } from 'react'
import Tooltip from '@/components/ui/Tooltip'
import { Transaction } from '../types'
import TransactionForm from './TransactionForm'
import { toast } from '@/components/ui'
import { TbTrash, TbCheck, TbX, TbRefresh } from 'react-icons/tb'
import { useTransactionStore } from '../store/transactionListStore'
import { ConfirmDialog } from '@/components/shared'
import { StatusType } from '@/components/shared/ConfirmDialog'
import { useDropdownOptionsStore } from '@/store/dropdownOptionsStore'
import { DatePicker } from '@/components/ui'

const ActionColumn = ({ selectedRow }: { selectedRow: Transaction }) => {
    const [confirmationOpen, setConfirmationOpen] = useState(false)
    const [confirmationAction, setConfirmationAction] = useState<
        'delete' | 'close' | null
    >(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [closeDate, setCloseDate] = useState<string>(new Date().toISOString().split('T')[0]) // Default to today's date
    const { updateTransaction, deleteTransaction } = useTransactionStore()
    const { statusOptions } = useDropdownOptionsStore()

    // Find status IDs for different statuses
    const findStatusId = useCallback(
        (statusName: string) => {
            const status = statusOptions.find(
                (s) => s.label.toLowerCase() === statusName.toLowerCase(),
            )
            return status?.value || ''
        },
        [statusOptions],
    )

    // Open confirmation dialog with specified action
    const openConfirmation = (action: 'delete' | 'close') => {
        setConfirmationAction(action)
        setConfirmationOpen(true)
        // Reset close date to today when opening the dialog
        if (action === 'close') {
            setCloseDate(new Date().toISOString().split('T')[0])
        }
    }

    // Handle changing transaction status
    const handleStatusChange = async (
        newStatus: string,
        closed_date?: string,
    ) => {
        setIsSubmitting(true)
        try {
            const statusId = findStatusId(newStatus)
            if (!statusId) {
                throw new Error(`Status "${newStatus}" not found`)
            }

            const result = await updateTransaction(selectedRow.id, {
                status_id: statusId,
                ...(closed_date && { closed_date: closed_date }),
            })
            if (!result?.success) {
                throw new Error(
                    result?.error || `Failed to update to ${newStatus}`,
                )
            }

            toast.notify(`Transaction marked as ${newStatus}`, 'success')
            setConfirmationOpen(false)
        } catch (error: unknown) {
            const errorObj = error as Error
            toast.notify(
                errorObj.message || 'Failed to update status',
                'danger',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle deleting transaction
    const handleDelete = async () => {
        setIsSubmitting(true)
        try {
            const result = await deleteTransaction(selectedRow.id)
            if (!result?.success) {
                throw new Error(result?.error || 'Failed to delete transaction')
            }

            toast.notify('Transaction deleted successfully', 'success')
            setConfirmationOpen(false)
        } catch (error: unknown) {
            const errorObj = error as Error
            toast.notify(
                errorObj.message || 'Failed to delete transaction',
                'danger',
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle confirmation dialog action
    const handleConfirmAction = async () => {
        if (confirmationAction === 'delete') {
            await handleDelete()
        } else if (confirmationAction === 'close') {
            // Convert the selected date to ISO string format
            const closed_date = new Date(closeDate).toISOString()
            await handleStatusChange('closed', closed_date)
        }
    }

    // Get confirmation dialog content based on action
    const getConfirmationContent = () => {
        if (confirmationAction === 'delete') {
            return {
                title: 'Delete transaction',
                message: 'Are you sure you want to delete this transaction?',
                type: 'warning',
            }
        } else if (confirmationAction === 'close') {
            return {
                title: 'Close transaction',
                message: 'Are you sure you want to close this transaction?',
                type: 'info',
            }
        }
        return {
            title: 'Confirm action',
            message: 'Are you sure you want to proceed?',
            type: 'warning',
        }
    }

    const isPending = selectedRow.statuses?.status?.toLowerCase() === 'pending'
    const isCancel = selectedRow.statuses?.status?.toLowerCase() === 'cancel'

    // Get confirmation content
    const confirmationContent = getConfirmationContent()

    return (
        <div className="flex items-center gap-3">
            {isPending ? (
                // Show actions only for pending transactions
                <>
                    <Tooltip title="Edit">
                        <TransactionForm isEdit selectedRow={selectedRow} />
                    </Tooltip>

                    <Tooltip title="Close">
                        <div
                            className="text-xl cursor-pointer select-none font-semibold text-green-500"
                            onClick={() => openConfirmation('close')}
                        >
                            <TbCheck />
                        </div>
                    </Tooltip>

                    <Tooltip title="Cancel">
                        <div
                            className="text-xl cursor-pointer select-none font-semibold text-yellow-500"
                            onClick={() => handleStatusChange('cancel')}
                        >
                            <TbX />
                        </div>
                    </Tooltip>

                    <Tooltip title="Delete">
                        <div
                            className="text-xl cursor-pointer select-none font-semibold text-red-500"
                            onClick={() => openConfirmation('delete')}
                        >
                            <TbTrash />
                        </div>
                    </Tooltip>
                </>
            ) : isCancel ? (
                // Show actions only for pending transactions
                <>
                    <Tooltip title="Edit">
                        <TransactionForm isEdit selectedRow={selectedRow} />
                    </Tooltip>

                    <Tooltip title="Reopen">
                        <div
                            className="text-xl cursor-pointer select-none font-semibold text-red-500"
                            onClick={() => handleStatusChange('pending')}
                        >
                            <TbRefresh />
                        </div>
                    </Tooltip>

                    <Tooltip title="Delete">
                        <div
                            className="text-xl cursor-pointer select-none font-semibold text-red-500"
                            onClick={() => openConfirmation('delete')}
                        >
                            <TbTrash />
                        </div>
                    </Tooltip>
                </>
            ) : (
                // Only edit for non-pending transactions
                <Tooltip title="Edit">
                    <TransactionForm isEdit selectedRow={selectedRow} />
                </Tooltip>
            )}

            <ConfirmDialog
                isOpen={confirmationOpen}
                type={confirmationContent.type as StatusType}
                title={confirmationContent.title}
                confirmButtonProps={{
                    loading: isSubmitting,
                    onClick: handleConfirmAction,
                }}
                onClose={() => setConfirmationOpen(false)}
                onRequestClose={() => setConfirmationOpen(false)}
                onCancel={() => setConfirmationOpen(false)}
            >
                <p>{confirmationContent.message}</p>
                {confirmationAction === 'close' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Close Date
                        </label>
                        <DatePicker
                            value={new Date(closeDate)}
                            onChange={(date: Date | null) => {
                                if (date) {
                                    setCloseDate(date.toLocaleString())
                                }
                            }}
                            inputFormat="YYYY-MM-DD"
                            placeholder="Select close date"
                            maxDate={new Date()}
                            minDate={new Date(selectedRow.pending_date)}
                        />
                    </div>
                )}
            </ConfirmDialog>
        </div>
    )
}

export default ActionColumn