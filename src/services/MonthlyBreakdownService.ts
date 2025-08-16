import ApiService from './ApiService'

export async function apiGetMonthlyBreakdown<T, U extends Record<string, unknown>>(params: U,) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/monthly-breakdown',
        method: 'get',
        params
    })
}
