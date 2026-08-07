import httpClient from './http.client'
import type { Paginated } from './pagination'
import type { Space } from './space.service'

export interface Booking {
  id: number
  userId: number
  spaceId: number
  date: string | null
  startTime: string | null
  endTime: string | null
  totalPrice: string | null
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  billing?: {
    billingName: string
    billingDocument: string
    billingEmail: string
    billingPhone: string
    billingAddress: string
  } | null
  createdAt: string
  updatedAt: string
  space?: Pick<Space, 'id' | 'name' | 'description' | 'capacity' | 'priceHour'> | null
  user?: { id: number; name: string; email: string } | null
}

export interface BookingBillingPayload {
  billingName: string
  billingDocument: string
  billingEmail: string
  billingPhone: string
  billingAddress: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const bookingService = {
  async create(payload: {
    spaceId: number
    userId?: number
    date: string
    startTime: string
    endTime: string
  } & BookingBillingPayload) {
    const res = await httpClient.post<ApiResponse<Booking>>('/bookings', payload)
    return res.data.data
  },

  async preReserve(spaceId: number) {
    const res = await httpClient.post<ApiResponse<Booking>>('/bookings/pre', { spaceId })
    return res.data.data
  },

  async complete(id: number, payload: {
    date: string
    startTime: string
    endTime: string
  } & BookingBillingPayload) {
    const res = await httpClient.patch<ApiResponse<Booking>>(`/bookings/${id}/complete`, payload)
    return res.data.data
  },

  async listMy(params: { status?: string; page?: number; limit?: number } = {}) {
    const res = await httpClient.get<ApiResponse<Paginated<Booking>>>('/bookings/my', { params })
    return res.data.data
  },

  async listAll(params: { status?: string; search?: string; userId?: number; page?: number; limit?: number } = {}) {
    const res = await httpClient.get<ApiResponse<Paginated<Booking>>>('/bookings', { params })
    return res.data.data
  },

  async cancel(id: number) {
    const res = await httpClient.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`)
    return res.data.data
  },
}
