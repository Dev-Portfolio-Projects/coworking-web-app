import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type LoginResponse } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref<LoginResponse['user'] | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const role = computed(() => user.value?.roleId)

  async function login(email: string, password: string) {
    const data = await authService.login({ email, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
  }

  async function register(email: string, password: string, name: string) {
    const data = await authService.register({ email, password, name })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
  }

  async function fetchProfile() {
    const data = await authService.getProfile()
    user.value = data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, isAuthenticated, role, login, register, fetchProfile, logout }
})
