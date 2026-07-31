import httpClient from './http.client'

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

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const spaceService = {
  async list(status?: string) {
    const params = status ? { status } : {}
    const res = await httpClient.get<ApiResponse<Space[]>>('/catalog/spaces', { params })
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
}
