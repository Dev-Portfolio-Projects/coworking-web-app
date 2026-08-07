import httpClient from './http.client'
import type { Paginated } from './pagination'

export interface AdminAmenity {
  id: number
  name: string
  description?: string
}

export interface AmenityListParams {
  search?: string
  page?: number
  limit?: number
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const amenityService = {
  async list(params: AmenityListParams = {}) {
    const res = await httpClient.get<ApiResponse<Paginated<AdminAmenity>>>('/amenities', { params })
    return res.data.data
  },
  async create(payload: { name: string; description?: string }) {
    const res = await httpClient.post<ApiResponse<AdminAmenity>>('/amenities', payload)
    return res.data.data
  },
  async update(id: number, payload: Partial<{ name: string; description?: string }>) {
    const res = await httpClient.patch<ApiResponse<AdminAmenity>>(`/amenities/${id}`, payload)
    return res.data.data
  },
  async delete(id: number) {
    const res = await httpClient.delete<ApiResponse<null>>(`/amenities/${id}`)
    return res.data
  },
}
