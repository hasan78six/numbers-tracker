import ApiService from './ApiService'

export async function apiGetBusinessTracker<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/business-tracker',
        method: 'get',
    })
}
