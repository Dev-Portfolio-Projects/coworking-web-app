import axios from 'axios'
import { toast } from 'vue-sonner'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

const PROTECTED_PREFIXES = ['/reservas', '/admin']
let sessionRedirectQueued = false

// Solo redirige a /login cuando la sesión caduca estando en una página protegida,
// y una sola vez por carga de página. En páginas públicas simplemente limpia la
// sesión en silencio (un 401 de fondo, p. ej. un refresco en segundo plano, no
// debe sacar al usuario de la app).
function handleSessionExpired(): void {
  const current = window.location.pathname
  const onProtectedRoute = PROTECTED_PREFIXES.some((prefix) => current.startsWith(prefix))
  const onAuthPage = current === '/login' || current === '/register'

  localStorage.removeItem('user')
  window.dispatchEvent(new CustomEvent('auth:session-expired'))

  if (onProtectedRoute && !sessionRedirectQueued && !onAuthPage) {
    sessionRedirectQueued = true
    window.location.href = '/login'
  }
}

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
      handleSessionExpired()
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
