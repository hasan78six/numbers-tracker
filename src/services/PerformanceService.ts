import ApiService from './ApiService'

export async function apiGetPerformance<T, U extends Record<string, unknown>>(params: U,) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/performance',
        method: 'get',
        params
    })
}
