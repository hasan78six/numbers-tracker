import { evaluateCalculation, FieldItem, getFieldValue, getRemainingDaysToProspect, getRemainingWeeksOfYear, getSumFromKey } from "@/utils/calculation"
import { ColumnData, FieldWithValue, RowData, WeeklyResults } from "../types"

export const calculateWeeklyTotals = (
    tableData: RowData[], 
    columns: ColumnData[], 
    fieldsWithValues: FieldWithValue[]
): WeeklyResults => {
    const results: WeeklyResults = {
        totals: {},
        goals: {},
    }

    // Get all column dates sorted in ascending order
    const sortedColumns = columns
        .filter((col) => col.key !== 'label')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    tableData.forEach((row) => {
        // Special handling for current_pending_income
        if (row.key === 'current_pending_income') {
            // Get the last day of the week (Sunday)
            const lastDayOfWeek = sortedColumns[sortedColumns.length - 3]?.date
            if (lastDayOfWeek) {
                const value = row.values[lastDayOfWeek]
                const num = typeof value === 'string' ? parseFloat(value) || 0 : 0
                results.totals[row.key] = num.toFixed(2)
            } else {
                results.totals[row.key] = '0.00'
            }
        } 
        // Calculate totals for other rows
        else if (row.inputType === 'checkbox') {
            const checkedCount = sortedColumns
                .reduce((count, col) => 
                    row.values[col.date as string] === true ? count + 1 : count, 0)
            
            results.totals[row.key] = `${checkedCount}`
        } else if (row.inputType === 'number' || row.inputType === 'float') {
            const sum = sortedColumns
                .reduce((total, col) => {
                    const value = row.values[col.date as string]
                    const num = typeof value === 'string' ? parseFloat(value) || 0 : 0
                    return total + num
                }, 0)
            
            results.totals[row.key] = sum.toFixed(2)
        }

        // Calculate goals
        if (row.formula) {
            try {
                results.goals[row.key] = evaluateCalculation(row.formula, fieldsWithValues)
            } catch (error) {
                console.error(`Error calculating goal for ${row.key}:`, error)
                results.goals[row.key] = 'Error'
            }
        }
    })

    return results
}


export const calculateBusinessFields = (
    tableData: RowData[],
    items: FieldItem[],
    workingDays: number,
    selectedDate: Date
  ): FieldWithValue[] => {

    const remaining_days_to_prospect = getRemainingDaysToProspect(
      tableData[0]?.values,
      workingDays as number,
      selectedDate
    )
    const hours_prospected_per_day = getFieldValue(items, 'hours_prospected_per_day')
    const remaining_work_weeks = getRemainingWeeksOfYear(selectedDate)
    const days_prospected = getFieldValue(items, 'days_prospected')
    const hours_prospected_goal = Number(hours_prospected_per_day) * Number(days_prospected)
    const total_listing_closed = getFieldValue(items, 'listing_closed')
    const percentage_of_listing_closed = getFieldValue(items, 'listing_closed_percentage')
    const hours_prospected_in_total = getSumFromKey(tableData, 'hours_prospected', selectedDate)
    const total_no_of_conversations_needed = getFieldValue(items, 'total_no_of_conversations_needed')
    const sumOfConversation = getSumFromKey(tableData, 'conversations', selectedDate)
    const remaining_no_of_conversations = total_no_of_conversations_needed - sumOfConversation
    const total_listing_appointment_set_goal = getFieldValue(items, 'listing_appointments_to_set')
    const listing_appointments_set_in_total = getSumFromKey(tableData, 'listing_appointments_set', selectedDate)
    const total_listing_appointment_gone_on_goal = getFieldValue(items, 'listing_appointments_gone_on')
    const listing_appointments_gone_on_in_total = getSumFromKey(tableData, 'listing_appointments_gone_on', selectedDate)
    const total_listing_taken_goal = getFieldValue(items, 'listings_taken')
    const listing_taken_in_total = getSumFromKey(tableData, 'listings_taken', selectedDate)
    const cancelled_withdrawn_listings = getSumFromKey(tableData, 'canceled_withdrawn_listings', selectedDate)
    const total_expired = getSumFromKey(tableData, 'expired', selectedDate)
    const total_listing_closed_goal = getFieldValue(items, 'listing_closed')
    const listing_closed_total = getSumFromKey(tableData, 'listings_closed', selectedDate)
    const total_no_of_buyer_offers_goal = getFieldValue(items, 'buyers_offer_written_goal')
    const total_no_of_buyer_offers = getSumFromKey(tableData, 'buyer_offers_written', selectedDate)
    const total_no_of_buyers_under_contract_goal = getFieldValue(items, 'target_buyers_under_contract')
    const total_no_of_buyers_under_contract = getSumFromKey(tableData, 'buyers_under_contract', selectedDate)
    const total_no_of_buyers_closed = getSumFromKey(tableData, 'buyers_closed', selectedDate)
    const total_gross_commission_income_goal = getFieldValue(items, 'gross_commission_income')
    const total_no_of_buyers_closed_goal = getFieldValue(items, 'buyer_sales')
    const total_closed_income = getSumFromKey(tableData, 'closed_income', selectedDate)

    const total_income_per_day = Number(total_closed_income  / days_prospected ).toFixed(2)
    const total_income_per_conversation = Number(total_closed_income  / sumOfConversation).toFixed(2) 

  
    return [
      { field_name: 'remaining_days_to_prospect', value: remaining_days_to_prospect },
      { field_name: 'hours_prospected_per_day', value: hours_prospected_per_day },
      { field_name: 'remaining_work_weeks', value: remaining_work_weeks },
      { field_name: 'hours_prospected_goal', value: hours_prospected_goal },
      { field_name: 'hours_prospected_in_total', value: hours_prospected_in_total },
      { field_name: 'remaining_no_of_conversations', value: remaining_no_of_conversations },
      { field_name: 'total_listing_appointment_set_goal', value: total_listing_appointment_set_goal },
      { field_name: 'listing_appointments_set_in_total', value: listing_appointments_set_in_total },
      { field_name: 'total_listing_appointment_gone_on_goal', value: total_listing_appointment_gone_on_goal },
      { field_name: 'listing_appointments_gone_on_in_total', value: listing_appointments_gone_on_in_total },
      { field_name: 'total_listing_taken_goal', value: total_listing_taken_goal },
      { field_name: 'listing_taken_in_total', value: listing_taken_in_total },
      { field_name: 'cancelled_withdrawn_listings', value: cancelled_withdrawn_listings },
      { field_name: 'total_expired', value: total_expired },
      { field_name: 'total_listing_closed', value: total_listing_closed },
      { field_name: 'percentage_of_listing_closed', value: percentage_of_listing_closed },
      { field_name: 'total_listing_closed_goal', value: total_listing_closed_goal },
      { field_name: 'listing_closed_total', value: listing_closed_total },
      { field_name: 'total_no_of_buyer_offers_goal', value: total_no_of_buyer_offers_goal },
      { field_name: 'total_no_of_buyer_offers', value: total_no_of_buyer_offers },
      { field_name: 'total_no_of_buyers_under_contract_goal', value: total_no_of_buyers_under_contract_goal },
      { field_name: 'total_no_of_buyers_under_contract', value: total_no_of_buyers_under_contract },
      { field_name: 'total_no_of_buyers_closed_goal', value: total_no_of_buyers_closed_goal },
      { field_name: 'total_no_of_buyers_closed', value: total_no_of_buyers_closed },
      { field_name: 'total_gross_commission_income_goal', value: total_gross_commission_income_goal },
      { field_name: 'total_closed_income', value: total_closed_income },
      { field_name: 'total_income_per_day', value: total_income_per_day },
      { field_name: 'total_income_per_conversation', value: total_income_per_conversation }
    ]
  }