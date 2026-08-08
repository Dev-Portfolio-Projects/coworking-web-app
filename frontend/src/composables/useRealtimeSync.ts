import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useSpaceStore } from '@/stores/space.store'
import { useBookingStore } from '@/stores/booking.store'
import { ROLE_ADMIN } from '@/utils/roles'

const SYNC_INTERVAL_MS = 30_000

export function useRealtimeSync() {
  const auth = useAuthStore()
  const spaceStore = useSpaceStore()
  const bookingStore = useBookingStore()

  async function sync() {
    if (!auth.isAuthenticated) return
    const jobs: Promise<unknown>[] = [
      spaceStore.refreshSpaces(),
      spaceStore.refreshAmenities(),
      bookingStore.refreshMyBookings(),
    ]
    if (auth.role === ROLE_ADMIN) {
      jobs.push(bookingStore.refreshAllBookings())
    }
    try {
      await Promise.allSettled(jobs)
    } catch {
      // refresco silencioso: los errores no interrumpen la app
    }
  }

  function handleVisibility() {
    if (document.visibilityState === 'visible') sync()
  }

  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibility)
    timer = setInterval(sync, SYNC_INTERVAL_MS)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibility)
    if (timer) clearInterval(timer)
  })
}
