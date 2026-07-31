import httpClient from './http.client'

export interface User {
  id: number
  email: string
  name: string
  roleId: number
  createdAt: string
  updatedAt: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const userService = {
  async list() {
    const res = await httpClient.get<ApiResponse<User[]>>('/users')
    return res.data.data
  },
  async create(payload: { email: string; password: string; name: string; roleId?: number }) {
    const res = await httpClient.post<ApiResponse<User>>('/users', payload)
    return res.data.data
  },
  async update(id: number, payload: Partial<{ email: string; password: string; name: string; roleId: number }>) {
    const res = await httpClient.patch<ApiResponse<User>>(`/users/${id}`, payload)
    return res.data.data
  },
  async delete(id: number) {
    const res = await httpClient.delete<ApiResponse<null>>(`/users/${id}`)
    return res.data
  },
}
