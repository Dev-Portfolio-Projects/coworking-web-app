import { defineStore } from 'pinia'
import { ref } from 'vue'
import { bookingService, type Booking, type BookingBillingPayload } from '@/services/booking.service'

type BookingListParams = {
  status?: string
  search?: string
  page?: number
  limit?: number
}

export const useBookingStore = defineStore('booking', () => {
  const bookings = ref<Booking[]>([])
  const allBookings = ref<Booking[]>([])
  const loading = ref(false)

  const page = ref(1)
  const limit = ref(12)
  const total = ref(0)
  const totalPages = ref(0)
  const myLastParams = ref<BookingListParams>({})

  const adminPage = ref(1)
  const adminLimit = ref(12)
  const adminTotal = ref(0)
  const adminTotalPages = ref(0)
  const adminLastParams = ref<BookingListParams>({})

  async function fetchMyBookings(params: BookingListParams = {}) {
    myLastParams.value = { ...params }
    loading.value = true
    try {
      const res = await bookingService.listMy(params)
      bookings.value = res.items
      total.value = res.meta.total
      totalPages.value = res.meta.totalPages
      page.value = res.meta.page
      limit.value = res.meta.limit
    } finally {
      loading.value = false
    }
  }

  async function refreshMyBookings() {
    try {
      const res = await bookingService.listMy(myLastParams.value)
      bookings.value = res.items
      total.value = res.meta.total
      totalPages.value = res.meta.totalPages
      page.value = res.meta.page
      limit.value = res.meta.limit
    } catch {
      // mantener los datos previos
    }
  }

  async function fetchAllBookings(params: BookingListParams = {}) {
    adminLastParams.value = { ...params }
    loading.value = true
    try {
      const res = await bookingService.listAll(params)
      allBookings.value = res.items
      adminTotal.value = res.meta.total
      adminTotalPages.value = res.meta.totalPages
      adminPage.value = res.meta.page
      adminLimit.value = res.meta.limit
    } finally {
      loading.value = false
    }
  }

  async function refreshAllBookings() {
    try {
      const res = await bookingService.listAll(adminLastParams.value)
      allBookings.value = res.items
      adminTotal.value = res.meta.total
      adminTotalPages.value = res.meta.totalPages
      adminPage.value = res.meta.page
      adminLimit.value = res.meta.limit
    } catch {
      // mantener los datos previos
    }
  }

  async function createBooking(payload: {
    spaceId: number
    userId?: number
    date: string
    startTime: string
    endTime: string
  } & BookingBillingPayload) {
    return bookingService.create(payload)
  }

  async function preReserveBooking(spaceId: number) {
    return bookingService.preReserve(spaceId)
  }

  async function completeBooking(id: number, payload: {
    date: string
    startTime: string
    endTime: string
  } & BookingBillingPayload) {
    return bookingService.complete(id, payload)
  }

  async function cancelBooking(id: number) {
    const updated = await bookingService.cancel(id)
    const idx = bookings.value.findIndex((b) => b.id === id)
    if (idx !== -1) bookings.value[idx] = updated
    const allIdx = allBookings.value.findIndex((b) => b.id === id)
    if (allIdx !== -1) allBookings.value[allIdx] = updated
    return updated
  }

  return {
    bookings,
    allBookings,
    loading,
    page, limit, total, totalPages, myLastParams,
    adminPage, adminLimit, adminTotal, adminTotalPages, adminLastParams,
    fetchMyBookings,
    refreshMyBookings,
    fetchAllBookings,
    refreshAllBookings,
    createBooking,
    preReserveBooking,
    completeBooking,
    cancelBooking,
  }
})
