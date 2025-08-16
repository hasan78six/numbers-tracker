import { StickySaveButton } from '@/components/shared'
import { Alert, Button, Card, Input, toast } from '@/components/ui'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { GoalsResponse } from './types'
import Loading from '@/components/shared/Loading'
import { useYearStore } from '@/store/yearStore'
import { useNavigate } from 'react-router-dom'
import { useGoalsStore } from './store/goalsStore'
import { useSessionUser } from '@/store/authStore'
import { evaluateCalculation } from '@/utils/calculation'

const Goals = () => {
    const navigate = useNavigate()
    const selectedYear = useYearStore((state) => state.selectedYear)
    const {
        fetchFields,
        items,
        loading: isLoading,
        updateGoals,
        fetchGoals,
        working_days,
        fetchDaysProspected,
        loading: working_days_loading,
    } = useGoalsStore()
    const { user } = useSessionUser()
    const moduleId = import.meta.env.VITE_MODULE_KEY
    const prevUserIdRef = useRef<string | null>(user.user_id)
    const prevYearRef = useRef<number | null>(Number(selectedYear))

    const [goals, setGoals] = useState<GoalsResponse>(items || [])
    const [loading, setLoading] = useState<boolean>(false)
    const [initialValues, setInitialValues] = useState<Record<string, number>>(
        {},
    )

    const transformedItems = useMemo(() => {
        return items.map((item) => {
            const baseValue =
                item.field_name === 'days_prospected'
                    ? working_days
                    : item.value || 0

            return {
                ...item,
                value: Number(baseValue) || 0,
            }
        })
    }, [items, working_days])

    useEffect(() => {
        setGoals(transformedItems)
    }, [transformedItems])

    useEffect(() => {
        if (transformedItems.length > 0) {
            const initial = transformedItems.reduce(
                (acc, goal) => {
                    acc[goal.field_name] = Number(goal.value) || 0
                    return acc
                },
                {} as Record<string, number>,
            )
            setInitialValues(initial)
        }
    }, [transformedItems])

    useEffect(() => {
        // Only run if goals are loaded and working_days is a valid number
        if (!goals.length || typeof working_days !== 'number') return

        // Step 1: Update the days_prospected field
        const workingCopy = goals.map((item) =>
            item.field_name === 'days_prospected'
                ? { ...item, value: working_days }
                : { ...item },
        )

        // Step 2: Update all calculated fields using the updated values in our working copy
        workingCopy.forEach((item, index) => {
            if (!item.calculation) return

            const fieldsAndValues = workingCopy.map((field) => ({
                field_name: field.field_name,
                value: field.value,
            }))

            let calculatedValue = evaluateCalculation(
                item.calculation,
                fieldsAndValues,
            )

            const total_closed_transactions = fieldsAndValues.find(
                (item) => item.field_name === 'total_closed_transactions',
            )?.value
            const listing_closed_percentage = fieldsAndValues.find(
                (item) => item.field_name === 'listing_closed_percentage',
            )?.value

            const isFloor =
                Number(total_closed_transactions) % 2 === 1 &&
                Number(listing_closed_percentage) === 50

            if (item.condition) {
                switch (item.condition.toUpperCase()) {
                    case 'FLOOR':
                        calculatedValue = Math.floor(calculatedValue)
                        break
                    case 'CEIL':
                        calculatedValue = Math.ceil(calculatedValue)
                        break
                    case 'ROUND':
                        calculatedValue = Math.round(calculatedValue)
                        break
                    case 'ROUNDFLOOR':
                        calculatedValue = isFloor
                            ? Math.floor(calculatedValue)
                            : Math.round(calculatedValue)
                        break
                    default:
                        break
                }
            }

            workingCopy[index] = {
                ...item,
                value: isNaN(calculatedValue)
                    ? 0
                    : Number(calculatedValue).toFixed(2),
            }
        })

        // Step 3: Set state with the fully updated working copy
        setGoals(workingCopy)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [working_days])

    const hasChanges = useMemo(() => {
        return goals.some((goal) => {
            const original = Number(initialValues[goal.field_name] ?? 0)
            const current = Number(goal.value ?? 0)
            return original !== current
        })
    }, [goals, initialValues])

    const handleKeyDown = useCallback(
        (
            e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
            fieldType: string,
        ) => {
            if (fieldType === 'number' && e.key === '.') {
                e.preventDefault()
            }
        },
        [],
    )

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target

            const workingCopy = [...goals]

            // Step 1: Update the changed field first
            const changedFieldIndex = workingCopy.findIndex(
                (item) => item.field_name === name,
            )

            if (changedFieldIndex !== -1) {
                const item = workingCopy[changedFieldIndex]
                const fieldType = item.field_types?.type
                let cleanValue =
                    fieldType === 'number' ? value.replace(/\./g, '') : value

                const parsedValue =
                    fieldType === 'float'
                        ? parseFloat(cleanValue)
                        : parseInt(cleanValue)

                workingCopy[changedFieldIndex] = {
                    ...item,
                    value: isNaN(parsedValue) ? '' : parsedValue,
                }
            }

            // Step 2: Update all calculated fields using the updated values in our working copy
            workingCopy.forEach((item, index) => {
                if (!item.calculation) return

                const fieldsAndValues = workingCopy.map((field) => ({
                    field_name: field.field_name,
                    value: field.value,
                }))

                let calculatedValue = evaluateCalculation(
                    item.calculation,
                    fieldsAndValues,
                )

                const total_closed_transactions = fieldsAndValues.find(
                    (item) => item.field_name === 'total_closed_transactions',
                )?.value
                const listing_closed_percentage = fieldsAndValues.find(
                    (item) => item.field_name === 'listing_closed_percentage',
                )?.value

                const isFloor =
                    Number(total_closed_transactions) % 2 === 1 &&
                    Number(listing_closed_percentage) === 50

                if (item.condition) {
                    switch (item.condition.toUpperCase()) {
                        case 'FLOOR':
                            calculatedValue = Math.floor(calculatedValue)
                            break
                        case 'CEIL':
                            calculatedValue = Math.ceil(calculatedValue)
                            break
                        case 'ROUND':
                            calculatedValue = Math.round(calculatedValue)
                            break
                        case 'ROUNDFLOOR':
                            calculatedValue = isFloor
                                ? Math.floor(calculatedValue)
                                : Math.round(calculatedValue)
                            break
                        default:
                            break
                    }
                }

                workingCopy[index] = {
                    ...item,
                    value: isNaN(calculatedValue)
                        ? 0
                        : Number(calculatedValue).toFixed(2),
                }
            })

            // Step 3: Set state with the fully updated working copy
            setGoals(workingCopy)
        },
        [goals],
    )

    const isSaveDisabled = useMemo(() => {
        if (!hasChanges) return true

        return goals.some(
            (goal) =>
                goal.is_editable &&
                !goal.calculation &&
                (goal.value === '' ||
                    goal.value === null ||
                    goal.value === undefined ||
                    Number.isNaN(goal.value)),
        )
    }, [goals, hasChanges])

    const handleSave = useCallback(async () => {
        try {
            const emptyFields = goals.filter(
                (goal) =>
                    goal.is_editable &&
                    !goal.calculation &&
                    (goal.value === '' ||
                        goal.value === 0 ||
                        goal.value === null ||
                        goal.value === undefined),
            )

            if (emptyFields.length > 0) {
                toast.notify(
                    'Please fill all required fields before saving.',
                    'danger',
                )
                return
            }

            setLoading(true)
            const payload = goals.map((item) => ({
                field_id: item.id,
                value: Number(item.value),
                year: Number(selectedYear),
                user_id: String(user?.user_id),
            }))

            await updateGoals(payload)
            const newInitial = goals.reduce(
                (acc, goal) => {
                    acc[goal.field_name] = Number(goal.value) || 0
                    return acc
                },
                {} as Record<string, number>,
            )
            setInitialValues(newInitial)

            toast.notify(
                `Your ${selectedYear} goals have been saved successfully!`,
                'success',
            )
        } catch (error: any) {
            toast.notify(`Failed to save goals: ${error.message}`, 'danger')
        } finally {
            setLoading(false)
        }
    }, [goals, selectedYear, user?.user_id, fetchGoals, updateGoals])

    const renderGoalInput = useCallback(
        ({
            label,
            description,
            field_name,
            field_types,
            is_editable,
            calculation,
            value,
        }: GoalsResponse[number]) => {
            return (
                <div
                    key={field_name}
                    className="grid grid-cols-[1fr_2.5fr_1fr] gap-4"
                >
                    <div className="font-medium">{label}</div>
                    <div className="text-gray-600 text-sm">{description}</div>
                    <Input
                        type="number"
                        min={1}
                        placeholder={
                            field_types?.type === 'float' ? '0.00' : '0'
                        }
                        name={field_name}
                        value={value?.toString() ?? ''}
                        className="text-right pr-8 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance:textfield]"
                        disabled={!is_editable || !!calculation}
                        onKeyDown={(e) => handleKeyDown(e, field_types?.type)}
                        onChange={handleInputChange}
                    />
                </div>
            )
        },
        [handleInputChange, handleKeyDown],
    )
    
    const renderGoalBreakDown = useCallback(
        ({
            label,
            // description,
            field_name,
            field_types,
            is_editable,
            calculation,
            value,
        }: GoalsResponse[number]) => {
            return (
                <div
                    key={field_name}
                    className="grid grid-cols-[2fr_1fr] gap-2"
                >
                    <div className="font-medium">{label}</div>
                    <Input
                        type="number"
                        min={1}
                        placeholder={
                            field_types?.type === 'float' ? '0.00' : '0'
                        }
                        name={field_name}
                        value={value?.toString() ?? ''}
                        className="text-right bg-transparent border-0 pr-8 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance:textfield]"
                        disabled={!is_editable || !!calculation}
                        onKeyDown={(e) => handleKeyDown(e, field_types?.type)}
                        onChange={handleInputChange}
                        size='sm'
                    />
                </div>
            )
        },
        [handleInputChange, handleKeyDown],
    )

    const renderScheduleAlert = useCallback(
        () => (
            <Card>
                <div className="flex justify-between items-center mb-8">
                    <h4>Set your {selectedYear} goals</h4>
                </div>
                <Alert
                    showIcon
                    type="info"
                    title={`Please set the schedule for year ${selectedYear}`}
                >
                    You will have to set the schedule for the year to set the
                    goals.
                    {selectedYear}
                    <Button
                        variant="plain"
                        className="p-0 h-auto pl-2 underline"
                        onClick={() => navigate('/schedule')}
                    >
                        Click Here to set.
                    </Button>
                </Alert>
            </Card>
        ),
        [navigate, selectedYear],
    )
   const renderGoalsForm = useCallback(
    () => {
        // Split goals into editable and disabled/calculated
        const editableGoals = goals.filter(goal => goal.is_editable && !goal.calculation)
        const disabledGoals = goals.filter(goal => !goal.is_editable || !!goal.calculation)

        return (
            <div>
                <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 mb-8">
                    {/* Editable fields (left) */}
                    <Card>
                        <div className="flex justify-between items-center mb-8">
                            <h4>Set your {selectedYear} goals</h4>
                        </div>
                        <div className="space-y-6">
                            {editableGoals.map(renderGoalInput)}
                        </div>
                    </Card>
                    {/* Disabled/calculated fields (right) */}
                    <Card>
                        <div className="flex justify-between items-center mb-8">
                            <h4>Goals Breakdown</h4>
                        </div>
                        <div className="space-y-1">
                            {disabledGoals.map(renderGoalBreakDown)}
                        </div>
                    </Card>
                </div>
                <StickySaveButton
                    buttonTitle="Save"
                    onClick={handleSave}
                    disabled={isSaveDisabled}
                    loading={loading}
                />
            </div>
        )
    },
    [
        goals,
        handleSave,
        isSaveDisabled,
        loading,
        renderGoalInput,
        selectedYear,
    ],
)

    const fetchData = async () => {
        await fetchFields(moduleId)
        await fetchGoals(user?.user_id as string, selectedYear)
    }

    const fetchDaysOnly = async () => {
    await fetchDaysProspected(user?.user_id as string, Number(selectedYear))
}

    // FETCH DATA ON FIRST LOAD
    useEffect(() => {
        const prevUserId = prevUserIdRef.current
        const prevYear = prevYearRef.current

        const userChanged = user.user_id !== prevUserId
        const yearChanged = Number(selectedYear) !== prevYear

        fetchDaysOnly()
        // Always fetch if schedule is null
        if (working_days === 0 || items.length === 0) {
            fetchData()
            prevUserIdRef.current = user.user_id
            prevYearRef.current = Number(selectedYear)
        }

        // If schedule exists, only fetch when user_id or selectedYear changes
        if (userChanged || yearChanged) {
            fetchData()
            prevUserIdRef.current = user.user_id
            prevYearRef.current = Number(selectedYear)
        }
    }, [user.user_id, selectedYear, working_days, items.length])

    return (
        <Loading
            loading={(isLoading && goals.length === 0) || working_days_loading}
        >
            {working_days !== 0 ? renderGoalsForm() : renderScheduleAlert()}
        </Loading>
    )
}

export default Goals
