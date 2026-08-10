import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import { useEffect } from 'react'

export function useApi() {
    const { getToken } = useAuth()

    useEffect(() => {
        const interceptor = api.interceptors.request.use(async (config) => {
            const token = await getToken()
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        })

        return () => {
            api.interceptors.request.eject(interceptor)
        }
    }, [getToken])

    return api
}