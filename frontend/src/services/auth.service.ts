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

export const authService = {
  async register(data: { email: string; password: string; name: string }) {
    const res = await httpClient.post<LoginResponse>('/auth/register', data)
    return res.data
  },

  async login(data: { email: string; password: string }) {
    const res = await httpClient.post<LoginResponse>('/auth/login', data)
    return res.data
  },

  async getProfile() {
    const res = await httpClient.get('/users/profile')
    return res.data
  },
}
