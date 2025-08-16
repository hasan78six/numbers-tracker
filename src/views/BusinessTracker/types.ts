export type Column = { name: string; key: string; isHighlighted?: boolean }

export type Row = {}

export interface ColumnData {
    key: string
    name: string
    date: string // YYYY-MM-DD format
    isHighlighted?: boolean
}

export interface RowData {
    id: string
    key: string
    label: string
    inputType?: 'text' | 'checkbox' | 'number' | 'float'
    values: Record<string, string | boolean>
    formula: string
}

export interface DataListingProps {
    columns: ColumnData[]
    isLoading: boolean
}
export type GetBusinessTrackerResponse = Row[]

export type Field = {
    id: string
    label: string
    description: string
    field_name: string
    field_types: {
        type: string
    }
    is_editable?: boolean
    value?: string | number
    priority: number
    calculation: string
}

export type FieldWithValue= {
    field_name: string;
    value: number | string | undefined;
}

export type WeeklyResults= {
    totals: Record<string, string | number>;
    goals: Record<string, string | number>;
}