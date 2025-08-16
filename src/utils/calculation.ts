export const evaluateCalculation = (
    formula: string,
    fields: Array<{ field_name: string; value: any }>,
) => {
    const fieldValues: Record<string, any> = {}
    fields.forEach((field) => {
        fieldValues[field.field_name] = field.value || 0
    })

    try {
        const evaluatedFormula = formula.replace(/[a-zA-Z_]+/g, (match) =>
            fieldValues[match] !== undefined ? fieldValues[match] : match,
        )
        const result = eval(evaluatedFormula)
        // Format the result if it's a number
        if (typeof result === 'number') {
            // Check if the number is decimal (has fractional part)
            if (result % 1 !== 0) {
                return parseFloat(result.toFixed(2))
            }
            return result
        }

        return 0 // Return 0 for non-number results
    } catch (error) {
        console.error('Error evaluating formula:', error)
        return 0
    }
}

// export const getRemainingDaysToProspect = (
//     data: Record<string, string | boolean> = {},
//     workingDays: number,
// ) => {
//     const totalSelectedDays = Object.values(data).filter(
//         (status) => status === true,
//     ).length

//     return workingDays - totalSelectedDays
// }

export const getRemainingDaysToProspect = (
    data: Record<string, string | boolean> = {},
    workingDays: number,
    selectedDate: Date
) => {
    // Get the current date
    const currentDate = new Date(selectedDate)

    // Calculate the start of the current week (Monday)
    const startOfWeek = new Date(currentDate)
    const dayOfWeek = currentDate.getDay() // 0 is Sunday, 1 is Monday, etc.
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust to make Monday the first day
    startOfWeek.setDate(currentDate.getDate() - diff)
    startOfWeek.setHours(0, 0, 0, 0)

    // Filter true values only for dates less than current week
    const totalSelectedDays = Object.entries(data).filter(
        ([dateStr, status]) => {
            if (status !== true) return false

            // Convert date string to Date object
            const entryDate = new Date(dateStr)

            // Check if the date is before the start of the current week
            return entryDate < startOfWeek
        },
    ).length

    return workingDays - totalSelectedDays
}

export function getRemainingWeeksOfYear(selectedDate: Date): number {
    const now = new Date(selectedDate)
    const currentYear = now.getFullYear()

    // Get the last day of the year (December 31)
    const lastDayOfYear = new Date(currentYear, 11, 31) // Month is 0-indexed (11 = December)

    // Calculate the difference in milliseconds between now and end of year
    const msRemaining = lastDayOfYear.getTime() - now.getTime()

    // Convert milliseconds to weeks (rounded down)
    const weeksRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24 * 7))

    return weeksRemaining
}

type TableItem = {
    key: string
    values?: Record<string, string | boolean | null | undefined>
}

// export function getSumFromKey(tableData: TableItem[], key: string, selectedDate: Date): number {
//     const data = tableData.find((item) => item.key === key)?.values

//     if (!data) return 0

//     return Object.values(data)
//         .filter(
//             (value): value is string =>
//                 typeof value === 'string' && value.trim() !== '',
//         )
//         .map((value) => parseFloat(value))
//         .filter((num) => !isNaN(num))
//         .reduce((acc, num) => acc + num, 0)
// }

export function getSumFromKey(tableData: TableItem[], key: string, selectedDate: Date): number {
    const checkedDates = tableData.find((item) => item.key === 'prospected_today')?.values;
    const data = tableData.find((item) => item.key === key)?.values;

    if (!data || !checkedDates) return 0;

    // Get the start of the current week (Monday)
    const currentDate = new Date(selectedDate);
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(currentDate.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return Object.entries(data)
        .filter(([dateStr, value]) => {
            const entryDate = new Date(dateStr);
            const isBeforeWeek = entryDate < startOfWeek;
            const isChecked = checkedDates[dateStr] === true;
            return isBeforeWeek && isChecked && typeof value === 'string' && value.trim() !== '';
        })
        .map(([, value]) => parseFloat(value as string))
        .filter((num) => !isNaN(num))
        .reduce((acc, num) => acc + num, 0);
}

export type FieldItem = {
    field_name: string
    value?: number | string | null
}

export function getFieldValue(items: FieldItem[], fieldName: string): number {
    const value = items.find((item) => item.field_name === fieldName)?.value

    // Convert to number safely and return 0 if invalid
    const num = typeof value === 'string' ? parseFloat(value) : value
    return !isNaN(Number(num)) && num !== null ? Number(num) : 0
}
