<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useBookingStore } from '@/stores/booking.store'
import { useSpaceStore } from '@/stores/space.store'
import { Motion } from 'motion-v'
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  Clock,
  DollarSign,
  DoorOpen,
  Eye,
  FileText,
  XCircle,
} from '@lucide/vue'
import type { Booking } from '@/services/booking.service'
import AdminPageLayout from '@/components/AdminPageLayout.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import BookingModal from '@/components/BookingModal.vue'
import BookingDetailsModal from '@/components/BookingDetailsModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import SelectDropdown from '@/components/SelectDropdown.vue'

const bookingStore = useBookingStore()
const spaceStore = useSpaceStore()

const search = ref('')
const statusFilter = ref<string>('')

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
]

const statusFilterOptions = statusOptions.map((o) => ({ value: o.value, label: o.label }))

const page = ref(1)
const limit = ref(6)

const statusStyles: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
}

const showBooking = ref(false)
const selectedBooking = ref<Booking | null>(null)

const showCancel = ref(false)
const cancelling = ref(false)
const cancellingBooking = ref<Booking | null>(null)

const showDetails = ref(false)
const detailsBooking = ref<Booking | null>(null)

function prefetchConfirmData() {
  const spaceIds = new Set<number>()
  for (const b of bookingStore.bookings) {
    if (isIncomplete(b) && b.spaceId) spaceIds.add(b.spaceId)
  }
  return Promise.allSettled(
    [...spaceIds].map(async (id) => {
      await spaceStore.ensureSpace(id)
      await spaceStore.fetchAvailabilityCached(id)
    }),
  )
}

async function load() {
  await bookingStore.fetchMyBookings({
    status: statusFilter.value || undefined,
    search: search.value.trim() || undefined,
    page: page.value,
    limit: limit.value,
  })
  prefetchConfirmData()
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
})

watch(statusFilter, () => {
  page.value = 1
  load()
})
watch(page, load)
watch(limit, () => {
  page.value = 1
  load()
})
watch(
  () => bookingStore.totalPages,
  (totalPages) => {
    if (totalPages > 0 && page.value > totalPages) page.value = totalPages
  },
)

function formatDate(value: string) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isIncomplete(b: Booking) {
  return b.status === 'PENDING' && !b.date && !b.startTime
}

function openConfirm(booking: Booking) {
  selectedBooking.value = booking
  showBooking.value = true
}

function closeBookingModal() {
  showBooking.value = false
  selectedBooking.value = null
}

function openCancel(booking: Booking) {
  cancellingBooking.value = booking
  showCancel.value = true
}

function closeCancelModal() {
  showCancel.value = false
  cancellingBooking.value = null
}

function openDetails(booking: Booking) {
  detailsBooking.value = booking
  showDetails.value = true
}

function closeDetails() {
  showDetails.value = false
  detailsBooking.value = null
}

async function handleCancelConfirm() {
  if (!cancellingBooking.value) return
  cancelling.value = true
  try {
    await bookingStore.cancelBooking(cancellingBooking.value.id)
    if (cancellingBooking.value.spaceId) spaceStore.invalidateAvailability(cancellingBooking.value.spaceId)
    closeCancelModal()
    load()
  } finally {
    cancelling.value = false
  }
}

onMounted(() => {
  const last = bookingStore.myLastParams
  const hasActiveFilters = !!statusFilter.value || !!search.value
  if (bookingStore.bookings.length > 0 && !hasActiveFilters && !last.status && !last.search) {
    bookingStore.refreshMyBookings().then(() => prefetchConfirmData())
  } else {
    load()
  }
})
</script>

<template>
  <AdminPageLayout
    title="Mis reservas"
    search-placeholder="Buscar por espacio..."
    v-model:search="search"
  >
    <template #filters>
      <SelectDropdown
        v-model="statusFilter"
        :options="statusFilterOptions"
        trigger-class="h-10 w-full sm:w-56"
      />
    </template>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div v-if="bookingStore.loading" class="flex flex-1 items-center justify-center">
        <Motion
          :animate="{ rotate: 360 }"
          :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Calendar :size="24" />
          </div>
        </Motion>
      </div>

      <div
        v-else-if="bookingStore.bookings.length === 0"
        class="flex flex-col items-center justify-center pt-16 text-center"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
          <CalendarDays :size="32" />
        </div>
        <p class="mt-4 text-lg font-medium text-gray-900">No hay reservas</p>
        <p class="mt-1 text-sm text-gray-500">
          Crea una reserva desde el catálogo de espacios para empezar.
        </p>
      </div>

      <div v-else class="mt-7 flex min-h-0 flex-1 flex-col md:mt-0">
        <div class="scroll-area flex-1 min-h-0 overflow-y-auto pr-4">
          <div class="grid gap-4 pb-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Motion
              v-for="(b, index) in bookingStore.bookings"
              :key="b.id"
              :initial="{ opacity: 0, y: 20 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: index * 0.06, duration: 0.4 }"
            >
              <article
  class="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg sm:p-6"
>
  <div class="flex items-start justify-between gap-3">
    <div class="flex min-w-0 items-center gap-3">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
      >
        <DoorOpen :size="20" />
      </span>

      <div class="min-w-0">
        <h3 class="truncate text-lg font-semibold text-gray-900">
          {{ b.space?.name ?? "Espacio" }}
        </h3>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <button
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
        @click="openDetails(b)"
      >
        <Eye :size="14" />
      </button>

      <span
        class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
        :class="statusStyles[b.status]"
      >
        {{ statusLabel[b.status] }}
      </span>
    </div>
  </div>

  <div class="mt-4 space-y-3 rounded-xl bg-gray-50 px-4 py-3">
    <p class="flex items-center gap-2.5 text-sm text-gray-900">
      <FileText :size="18" class="shrink-0 text-gray-400" />
      <span class="line-clamp-2">{{ b.space?.description || "Sin descripción disponible." }}</span>
    </p>
    <div class="grid grid-cols-2 gap-3">
      <p class="flex items-center gap-2.5 text-sm text-gray-900">
        <Calendar :size="18" class="shrink-0 text-gray-400" />
        <span class="truncate">{{ b.date ?? "Pendiente" }}</span>
      </p>
      <p class="flex items-center gap-2.5 text-sm text-gray-900">
        <Clock :size="18" class="shrink-0 text-gray-400" />
        <span class="truncate">
          {{
            b.startTime
              ? `${b.startTime.slice(0, 5)} - ${b.endTime?.slice(0, 5)}`
              : "Pendiente"
          }}
        </span>
      </p>
    </div>
  </div>

  <div class="mt-auto pt-4">
    <div
      class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-gray-400">
          Total
        </p>

        <p
          class="mt-1 flex items-center gap-1 text-lg font-semibold text-gray-900"
        >
          <DollarSign :size="16" class="text-blue-500" />
          {{ b.totalPrice ? `${b.totalPrice}` : "—" }}
        </p>
      </div>

      <div
        class="flex flex-col gap-2 sm:flex-row sm:justify-end"
      >
        <button
          v-if="isIncomplete(b)"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
          @click="openConfirm(b)"
        >
          <CalendarCheck :size="14" />
          Confirmar
        </button>

        <button
          v-if="b.status !== 'CANCELLED'"
          class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-red-50 hover:text-red-600"
          @click="openCancel(b)"
        >
          <XCircle :size="14" />
          Cancelar
        </button>
      </div>
    </div>
  </div>
</article>
            </Motion>
          </div>
        </div>

        <PaginationBar
          v-if="!bookingStore.loading && bookingStore.bookings.length > 0"
          v-model:page="page"
          v-model:limit="limit"
          :total-pages="bookingStore.totalPages"
          :total="bookingStore.total"
        />
      </div>
    </div>
  </AdminPageLayout>

  <BookingModal
    :show="showBooking"
    :space="null"
    :booking="selectedBooking"
    @close="closeBookingModal"
    @created="load"
  />

  <ConfirmModal
    :show="showCancel"
    title="Cancelar reserva"
    :message="`¿Cancelar la reserva de ${cancellingBooking?.space?.name ?? 'este espacio'}? Esta acción no se puede deshacer.`"
    confirm-label="Cancelar"
    :confirm-icon="XCircle"
    :loading="cancelling"
    @confirm="handleCancelConfirm"
    @cancel="closeCancelModal"
  />

  <BookingDetailsModal
    :show="showDetails"
    :booking="detailsBooking"
    @close="closeDetails"
  />
</template>

<style scoped>
.scroll-area {
  overflow-y: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: #2563eb transparent;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
}

.scroll-area::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-area::-webkit-scrollbar-thumb {
  background: #2563eb;
  border-radius: 9999px;
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background: #1d4ed8;
}
</style>
