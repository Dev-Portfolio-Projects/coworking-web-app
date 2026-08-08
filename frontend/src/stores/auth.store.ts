import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type AuthUser } from '@/services/auth.service'

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(readStoredUser())

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.roleId)

  function persistUser(value: AuthUser) {
    user.value = value
    localStorage.setItem('user', JSON.stringify(value))
  }

  async function login(email: string, password: string) {
    const data = await authService.login({ email, password })
    persistUser(data.user)
  }

  async function register(email: string, password: string, name: string) {
    const data = await authService.register({ email, password, name })
    persistUser(data.user)
  }

  async function fetchProfile() {
    const data = await authService.getProfile()
    persistUser(data)
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      user.value = null
      localStorage.removeItem('user')
    }
  }

  return { user, isAuthenticated, role, login, register, fetchProfile, logout }
})
