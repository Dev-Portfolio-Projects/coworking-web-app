import httpClient from './http.client'

export interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    name: string
    roleId: number
  }
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
    const res = await httpClient.get<ApiResponse<LoginResponse['user']>>('/users/profile')
    return res.data.data
  },
}
