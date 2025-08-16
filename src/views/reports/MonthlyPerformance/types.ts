export type MonthlyBreakdownItem = {
    metric: string;
    Jan: number | string;
    Feb: number | string;
    Mar: number | string;
    Apr: number | string;
    May: number | string;
    Jun: number | string;
    Jul: number | string;
    Aug: number | string;
    Sep: number | string;
    Oct: number | string;
    Nov: number | string;
    Dec: number | string;
  }

export type GetMonthlyResponse = {
    list: MonthlyBreakdownItem[]
    total: number
}

export interface MonthlyMatrices {
  [key: string]: any
}
