import httpClient from './http.client'
import type { Paginated } from './pagination'

export interface Space {
  id: number
  name: string
  description: string
  capacity: number
  priceHour: string
  images: string[] | null
  status: 'AVAILABLE' | 'UNAVAILABLE'
  amenities?: Amenity[]
  createdAt: string
  updatedAt: string
}

export interface Amenity {
  id: number
  name: string
  description?: string
}

export interface AvailabilitySlot {
  id: number
  availableDate: string
  startTime: string
  endTime: string
  booked: boolean
}

export interface SpaceAvailability {
  spaceId: number
  slots: AvailabilitySlot[]
}

export interface AvailabilitySlotPayload {
  availableDate: string
  startTime: string
  endTime: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface SpaceListParams {
  status?: string
  search?: string
  capacityMin?: number
  capacityMax?: number
  priceMin?: number
  priceMax?: number
  amenityId?: number
  page?: number
  limit?: number
}

export const spaceService = {
  async list(params: SpaceListParams = {}) {
    const res = await httpClient.get<ApiResponse<Paginated<Space>>>('/catalog/spaces', { params })
    return res.data.data
  },

  async getById(id: number) {
    const res = await httpClient.get<ApiResponse<Space>>(`/catalog/spaces/${id}`)
    return res.data.data
  },

  async create(payload: {
    name: string
    description: string
    capacity: number
    priceHour: number
    images?: string[]
    status?: string
    amenityIds?: number[]
  }) {
    const res = await httpClient.post<ApiResponse<Space>>('/spaces', payload)
    return res.data.data
  },

  async update(id: number, payload: Partial<{
    name: string
    description: string
    capacity: number
    priceHour: number
    images: string[]
    status: string
    amenityIds: number[]
  }>) {
    const res = await httpClient.patch<ApiResponse<Space>>(`/spaces/${id}`, payload)
    return res.data.data
  },

  async delete(id: number) {
    const res = await httpClient.delete<ApiResponse<null>>(`/spaces/${id}`)
    return res.data
  },

  async listAmenities() {
    const res = await httpClient.get<ApiResponse<Amenity[]>>('/catalog/amenities')
    return res.data.data
  },

  async getAvailability(spaceId: number) {
    const res = await httpClient.get<ApiResponse<SpaceAvailability>>(`/catalog/spaces/${spaceId}/availability`)
    return res.data.data
  },

  async getAdminAvailability(spaceId: number) {
    const res = await httpClient.get<ApiResponse<SpaceAvailability>>(`/spaces/${spaceId}/availability`)
    return res.data.data
  },

  async setAvailability(spaceId: number, slots: AvailabilitySlotPayload[]) {
    const res = await httpClient.put<ApiResponse<SpaceAvailability>>(`/spaces/${spaceId}/availability`, { slots })
    return res.data.data
  },
}
