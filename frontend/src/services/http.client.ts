import axios from 'axios'
import { toast } from 'vue-sonner'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

httpClient.interceptors.response.use(
  (response) => {
    const { config, data } = response
    if (data?.message && config.method !== 'get' && !(config as { skipToast?: boolean }).skipToast) {
      toast.success(data.message)
    }
    return response
  },
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }
    const message = error.response?.data?.message
    if (message) {
      toast.error(message)
    }
    return Promise.reject(error)
  },
)

export default httpClient
