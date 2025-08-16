import ApiService from './ApiService'

export async function apiGetDashboard<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/dashboard',
        method: 'get',
    })
}
