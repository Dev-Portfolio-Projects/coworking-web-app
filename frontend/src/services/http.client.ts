import axios from 'axios'
import { toast } from 'vue-sonner'

const httpClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => {
    const { config, data } = response
    if (data?.message && config.method !== 'get') {
      toast.success(data.message)
    }
    return response
  },
  (error) => {
    const isAuthEndpoint = error.config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
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
