import httpClient from './http.client'

export interface AuthUser {
  id: number
  email: string
  name: string
  roleId: number
}

export interface LoginResponse {
  user: AuthUser
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const authService = {
  async register(data: { email: string; password: string; name: string }) {
    const res = await httpClient.post<ApiResponse<LoginResponse>>('/auth/register', data)
    return res.data.data
  },

  async login(data: { email: string; password: string }) {
    const res = await httpClient.post<ApiResponse<LoginResponse>>('/auth/login', data)
    return res.data.data
  },

  async getProfile() {
    const res = await httpClient.get<ApiResponse<AuthUser>>('/users/profile')
    return res.data.data
  },

  async logout() {
    const res = await httpClient.post<ApiResponse<null>>('/auth/logout')
    return res.data
  },
}
