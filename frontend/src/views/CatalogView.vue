<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useSpaceStore } from '@/stores/space.store'
import { useBookingStore } from '@/stores/booking.store'
import { Motion } from 'motion-v'
import { Users, CalendarPlus, DoorOpen, DollarSign, Check, Search, XCircle, FileText } from '@lucide/vue'
import type { Space, SpaceListParams } from '@/services/space.service'
import type { Booking } from '@/services/booking.service'
import MouseGlowBackground from '@/components/MouseGlowBackground.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import BookingModal from '@/components/BookingModal.vue'
import SelectDropdown from '@/components/SelectDropdown.vue'

const spaceStore = useSpaceStore()
const auth = useAuthStore()
const bookingStore = useBookingStore()
const router = useRouter()
const route = useRoute()

const MAX_VISIBLE_AMENITIES = 2

const page = ref(1)
const limit = ref(6)

const search = ref('')
const capacityFilter = ref<string>('')
const priceFilter = ref<string>('')
const amenityFilter = ref<string | number>('')

const amenityOptions = computed(() => [
  { value: '', label: 'Todos los recursos' },
  ...spaceStore.amenities.map((a) => ({ value: a.id, label: a.name })),
])

const capacityOptions = [
  { value: '', label: 'Todas las capacidades' },
  { value: 'small', label: 'Hasta 60' },
  { value: 'medium', label: '61-200' },
  { value: 'large', label: 'Más de 200' },
]

const priceOptions = [
  { value: '', label: 'Todos los precios' },
  { value: 'low', label: '< $15' },
  { value: 'mid', label: '$15-20' },
  { value: 'high', label: '> $20' },
]

const showBooking = ref(false)
const selectedSpace = ref<Space | null>(null)
const preBooking = ref<Booking | null>(null)
const reservingSpaceId = ref<number | null>(null)
const reserveError = ref('')

function buildParams(): SpaceListParams {
  const params: SpaceListParams = { status: 'AVAILABLE', page: page.value, limit: limit.value }
  if (search.value.trim()) params.search = search.value.trim()
  if (capacityFilter.value === 'small') params.capacityMax = 60
  else if (capacityFilter.value === 'medium') {
    params.capacityMin = 61
    params.capacityMax = 200
  } else if (capacityFilter.value === 'large') params.capacityMin = 201

  if (priceFilter.value === 'low') params.priceMax = 15
  else if (priceFilter.value === 'mid') {
    params.priceMin = 15
    params.priceMax = 20
  } else if (priceFilter.value === 'high') params.priceMin = 20

  if (amenityFilter.value !== '') params.amenityId = Number(amenityFilter.value)
  return params
}

function load() {
  spaceStore.fetchSpaces(buildParams())
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
})
watch([capacityFilter, priceFilter, amenityFilter], () => {
  page.value = 1
  load()
})
watch(page, load)
watch(limit, () => {
  page.value = 1
  load()
})
watch(
  () => spaceStore.totalPages,
  (totalPages) => {
    if (totalPages > 0 && page.value > totalPages) page.value = totalPages
  },
)

onMounted(() => {
  const hasActiveFilters = !!search.value || !!capacityFilter.value || !!priceFilter.value || amenityFilter.value !== ''
  if (spaceStore.spaces.length > 0 && !hasActiveFilters) {
    spaceStore.refreshSpaces(buildParams())
  } else {
    load()
  }
  spaceStore.fetchAmenities()
})

async function reserve(space: Space) {
  if (!auth.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  reserveError.value = ''
  reservingSpaceId.value = space.id
  try {
    const booking = await bookingStore.preReserveBooking(space.id)
    preBooking.value = booking
    selectedSpace.value = space
    showBooking.value = true
  } catch {
    reserveError.value = 'No se pudo pre-reservar el espacio. Intenta de nuevo.'
  } finally {
    reservingSpaceId.value = null
  }
}

function handleBookingCreated() {
  preBooking.value = null
  selectedSpace.value = null
  load()
}

function visibleAmenities(space: Space) {
  return space.amenities?.slice(0, MAX_VISIBLE_AMENITIES) ?? []
}

function extraAmenitiesCount(space: Space) {
  return Math.max(0, (space.amenities?.length ?? 0) - MAX_VISIBLE_AMENITIES)
}
</script>

<template>
  <MouseGlowBackground>
    <div class="relative flex h-full min-h-0 flex-col">
      <header class="relative z-10 mx-auto w-full max-w-6xl shrink-0 px-6 pb-5 pt-5">
        <Motion
          :initial="{ opacity: 0, y: -15 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
        >
          <h1 class="text-3xl font-bold tracking-tight text-gray-900">Espacios disponibles</h1>
        </Motion>
        <Motion
          v-if="reserveError"
          :initial="{ opacity: 0, y: -8 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.3 }"
        >
          <div class="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <XCircle :size="17" />
            {{ reserveError }}
          </div>
        </Motion>
      </header>

      <div class="relative z-30 mx-auto w-full max-w-6xl shrink-0 px-6 pb-4">
        <Motion
          :initial="{ opacity: 0, y: -10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.4, delay: 0.1 }"
        >
          <div class="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/80 p-4 backdrop-blur-xl">
            <div class="flex flex-wrap items-center gap-2">
              <div class="relative w-full sm:min-w-[220px] sm:flex-1">
                <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="search"
                  type="text"
                  placeholder="Buscar por nombre o descripción..."
                  class="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <SelectDropdown
                v-model="amenityFilter"
                :options="amenityOptions"
                trigger-class="h-10 w-full sm:w-56"
              />
              <SelectDropdown
                v-model="capacityFilter"
                :options="capacityOptions"
                trigger-class="h-10 w-full sm:w-56"
              />
              <SelectDropdown
                v-model="priceFilter"
                :options="priceOptions"
                trigger-class="h-10 w-full sm:w-56"
              />
            </div>
          </div>
        </Motion>
      </div>

      <div class="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-6 pb-3">
        <div class="scroll-area min-h-0 flex-1 overflow-y-auto pr-1">
        <div v-if="spaceStore.loading" class="flex justify-center pt-16">
          <Motion
            :animate="{ rotate: 360 }"
            :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <DoorOpen :size="24" />
            </div>
          </Motion>
        </div>

        <div v-else-if="spaceStore.spaces.length === 0" class="pt-16 text-center">
          <p class="text-gray-500">No hay espacios que coincidan con los filtros.</p>
        </div>

        <template v-else>
          <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Motion
              v-for="(space, index) in spaceStore.spaces"
              :key="space.id"
              :initial="{ opacity: 0, y: 20 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: index * 0.08, duration: 0.4 }"
              class="h-full"
            >
              <article
                class="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg sm:p-6"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2.5">
                      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <DoorOpen :size="18" />
                      </span>
                      <h3 class="truncate text-lg font-semibold text-gray-900">{{ space.name }}</h3>
                    </div>
                  </div>
                  <button
                    class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="reservingSpaceId !== null"
                    @click="reserve(space)"
                  >
                    <Motion
                      v-if="reservingSpaceId === space.id"
                      :animate="{ rotate: 360 }"
                      :transition="{ duration: 1, repeat: Infinity, ease: 'linear' }"
                    >
                      <CalendarPlus :size="15" />
                    </Motion>
                    <CalendarPlus v-else :size="15" />
                    {{ reservingSpaceId === space.id ? 'Guardando...' : 'Pre Reservar' }}
                  </button>
                </div>

                <div class="mt-4 space-y-3 rounded-xl bg-gray-50 px-4 py-3">
                  <p class="flex items-center gap-2.5 text-sm text-gray-900">
                    <FileText :size="18" class="shrink-0 text-gray-400" />
                    <span class="line-clamp-2">{{ space.description }}</span>
                  </p>
                  <div class="grid grid-cols-2 gap-3">
                    <p class="flex items-center gap-2.5 text-sm text-gray-900">
                      <Users :size="18" class="shrink-0 text-gray-400" />
                      <span class="truncate">{{ space.capacity }} personas</span>
                    </p>
                    <p class="flex items-center gap-2.5 text-sm text-gray-900">
                      <DollarSign :size="18" class="shrink-0 text-gray-400" />
                      <span class="truncate">{{ space.priceHour }}/hora</span>
                    </p>
                  </div>
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-1.5">
                  <span
                    v-for="a in visibleAmenities(space)"
                    :key="a.id"
                    class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                  >
                    <Check :size="12" />
                    {{ a.name }}
                  </span>
                  <span
                    v-if="extraAmenitiesCount(space) > 0"
                    class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
                  >
                    +{{ extraAmenitiesCount(space) }}
                  </span>
                </div>
              </article>
            </Motion>
          </div>
        </template>
        </div>

        <PaginationBar
          v-if="!spaceStore.loading && spaceStore.spaces.length > 0"
          v-model:page="page"
          v-model:limit="limit"
          :total-pages="spaceStore.totalPages"
          :total="spaceStore.total"
          :page-size-options="[6, 9, 12]"
        />
      </div>
    </div>
  </MouseGlowBackground>

  <BookingModal
    :show="showBooking"
    :space="selectedSpace"
    :booking="preBooking"
    @close="showBooking = false"
    @created="handleBookingCreated"
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
