import httpClient from './http.client'

export interface DashboardCounters {
  availableSpaces: number
  totalSpaces: number
  confirmedBookings: number
  pendingBookings: number
  cancelledBookings: number
  revenue: number
  clients: number
}

export interface BookingByDay {
  date: string
  total: number
}

export interface BookingByStatus {
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  total: number
}

export interface BookingBySpace {
  spaceId: number
  spaceName: string
  total: number
}

export interface RecentBooking {
  id: number
  spaceName: string
  userName: string
  date: string | null
  startTime: string | null
  endTime: string | null
  totalPrice: string | null
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
}

export interface DashboardData {
  counters: DashboardCounters
  bookingsByDay: BookingByDay[]
  bookingsByStatus: BookingByStatus[]
  bookingsBySpace: BookingBySpace[]
  recentBookings: RecentBooking[]
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const dashboardService = {
  async get() {
    const res = await httpClient.get<ApiResponse<DashboardData>>('/dashboard')
    return res.data.data
  },
}
