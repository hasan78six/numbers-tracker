import { useCallback, useEffect, useMemo, useState } from 'react'
import { TableRowSkeleton } from '@/components/shared'
import { Card, Checkbox, Input } from '@/components/ui'
import Table from '@/components/ui/Table'
import { ColumnData, DataListingProps, FieldWithValue, RowData } from '../types'
import { useBusinessTrackerStore } from '../store/bussinessStore'
import { formatDateToYMD } from '@/utils/formatDateTime'
import { useSessionUser } from '@/store/authStore'
import { debounce } from 'lodash'

import { useScheduleStore } from '@/views/Schedule/store/scheduleStore'
import { useGoalsStore } from '@/views/Goals/store/goalsStore'
import { calculateBusinessFields, calculateWeeklyTotals } from '../helper'

const { Tr, Th, Td, THead, TBody } = Table

const EmptyState = () => (
    <Card>
        <div className="flex flex-col items-center gap-4">
            <span className="font-semibold">No data found!</span>
        </div>
    </Card>
)

const DataListing = ({ columns, isLoading }: DataListingProps) => {
    const {
        calendarDate: selectedDate,
        tableData,
        updateTableData,
        setTableData,
    } = useBusinessTrackerStore()
    const { user, fetchCurrentTime } = useSessionUser()
    const { schedule } = useScheduleStore()
    const { items } = useGoalsStore()
    const [currentTime, setCurrentTime] = useState<any>(null)
    const [currentDateColumn, setCurrentDateColumn] = useState<string | null>(
        null,
    )

    // Memoize field values to prevent recalculations
    const fieldsWithValues = useMemo(
        (): FieldWithValue[] =>
            calculateBusinessFields(
                tableData,
                items,
                Number(schedule?.working_days),
                selectedDate as Date,
            ),
        [tableData, items, schedule?.working_days, selectedDate],
    )

    // Memoize weekly totals calculation
    const weeklyTotals = useMemo(
        () => calculateWeeklyTotals(tableData, columns, fieldsWithValues),
        [tableData, columns, fieldsWithValues],
    )

    const fetchTime = useCallback(async () => {
        try {
            const currentTimeData = await fetchCurrentTime()
            setCurrentTime(currentTimeData)
        } catch (error) {
            console.error('Failed to fetch time:', error)
            setCurrentTime(null)
        }
    }, [fetchCurrentTime])

    useEffect(() => {
        fetchTime()
    }, [])


    useEffect(() => {
        if (tableData.length > 0 && columns) {
            const checkCurrentDate = async () => {
                try {
                    const dateTime = currentTime?.dateTime
                    if (dateTime) {
                        const today = formatDateToYMD(new Date(dateTime))
                        const currentCol = columns.find(
                            (col) => col.date === today,
                        )
                        if (currentCol) {
                            setCurrentDateColumn(currentCol.date)
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch time:', error)
                }
            }

            checkCurrentDate()
        }
    }, [tableData.length, columns, currentTime])

    // Create debounced update function
    const debouncedUpdate = useMemo(
        () =>
            debounce(
                (
                    rowKey: string,
                    colKey: string,
                    value: string | boolean,
                    userId: string,
                ) => {
                    updateTableData(rowKey, colKey, value, userId)
                },
                500,
            ),
        [updateTableData],
    )

    // Clean up debounce on unmount
    useEffect(() => {
        return () => {
            debouncedUpdate.cancel()
        }
    }, [debouncedUpdate])

    // Handle input changes with local state update and debounced API update
    const handleInputChange = useCallback(
        (rowKey: string, colKey: string, value: string) => {
            const updatedData = tableData.map((row) =>
                row.id === rowKey
                    ? {
                          ...row,
                          values: {
                              ...row.values,
                              [colKey]: value,
                          },
                      }
                    : row,
            )
            setTableData(updatedData)
            debouncedUpdate(rowKey, colKey, value, user?.user_id as string)
        },
        [debouncedUpdate, user?.user_id, tableData, setTableData],
    )

    // Handle checkbox changes with immediate update
    const handleCheckboxChange = useCallback(
        (rowKey: string, colKey: string, checked: boolean) => {
            const updatedData = tableData.map((row) =>
                row.id === rowKey
                    ? {
                          ...row,
                          values: {
                              ...row.values,
                              [colKey]: checked,
                          },
                      }
                    : row,
            )
            setTableData(updatedData)
            updateTableData(rowKey, colKey, checked, user?.user_id as string)
        },
        [updateTableData, user?.user_id, tableData, setTableData],
    )

    // Check if column is special type (weekly total or goals)
    const isSpecialColumn = useCallback(
        (columnKey: string): boolean =>
            columnKey === 'weeklyTotal' || columnKey === 'weeklyGoals',
        [],
    )

    // Render empty state if no data
    if (!isLoading && tableData?.length === 0) {
        return <EmptyState />
    }

    // Render cell content based on type
    const renderCellContent = (
        row: RowData,
        column: ColumnData,
        isEnableColumn: boolean,
        isDisabledRow: boolean,
    ) => {
        const isCheckbox = row.inputType === 'checkbox'
        const isSpecialCol = isSpecialColumn(column.key)
        const cellValue = isSpecialCol
            ? column.key === 'weeklyTotal'
                ? weeklyTotals.totals[row.key] || '0'
                : weeklyTotals.goals[row.key] || '0'
            : row.values[column.date as string] || ''

        if (isSpecialCol) {
            return <span className="block text-center">{cellValue}</span>
        }

        if (isCheckbox) {
            const isChecked =
                cellValue === true || cellValue === 'true' || cellValue === '1'
            // Determine if this column is a future date
            const today = new Date()
            const colDate = column.date ? new Date(column.date) : null
            const isFutureColumn = colDate && colDate > today
            return (
                <Checkbox
                    checked={isChecked}
                    onChange={isFutureColumn ? undefined : () => {
                        const newValue = !isChecked
                        handleCheckboxChange(
                            row.id,
                            column.date as string,
                            newValue,
                        )
                    }}
                    disabled={isFutureColumn ?? undefined}
                    className={isFutureColumn ? 'cursor-not-allowed' : ''}
                />
            )
        }

        return (
            <Input
                size="sm"
                value={cellValue as string}
                className="text-center"
                placeholder={row?.inputType === 'float' ? '$0.00' : '0'}
                disabled={!isEnableColumn || isDisabledRow}
                onChange={(e) =>
                    handleInputChange(
                        row.id,
                        column.date as string,
                        e.target.value,
                    )
                }
            />
        )
    }

    return (
        <Card bodyClass="p-0">
            <Table
                className={
                    isLoading || tableData?.length === 0
                        ? 'min-w-[100%]'
                        : 'min-w-[1400px]'
                }
            >
                <THead>
                    <Tr>
                        {columns?.map((column, colIndex) => (
                            <Th
                                key={`${column.key}-${colIndex}`}
                                className={
                                    column.date === currentDateColumn
                                        ? 'bg-sky-100'
                                        : ''
                                }
                            >
                                {column.name}
                            </Th>
                        ))}
                    </Tr>
                </THead>

                {isLoading ? (
                    <TableRowSkeleton columns={columns?.length} rows={10} />
                ) : (
                    <TBody>
                        {tableData.map((row, rowIndex) => (
                            <Tr key={`${row.key}-${rowIndex}`}>
                                <Td>{row.label}</Td>
                                {columns.slice(1).map((column, colIndex) => {
                                    const isCurrentDateCol =
                                        column.date === currentDateColumn
                                    const rowValues = tableData.find(
                                        (item) =>
                                            item.key === 'prospected_today',
                                    )?.values as any

                                    const isEnableColumn =
                                        rowValues?.[column.date]

                                    const isDisabledRow = row.key === 'current_pending_income' || row.key === 'closed_income'

                                    return (
                                        <Td
                                            key={`${column.key}-${colIndex}`}
                                            className={
                                                isCurrentDateCol
                                                    ? 'bg-sky-100'
                                                    : ''
                                            }
                                        >
                                            {renderCellContent(
                                                row,
                                                column,
                                                isEnableColumn,
                                                isDisabledRow
                                            )}
                                        </Td>
                                    )
                                })}
                            </Tr>
                        ))}
                    </TBody>
                )}
            </Table>
        </Card>
    )
}

export default DataListing
