<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Booking } from '@/services/booking.service'
import type { Space } from '@/services/space.service'
import { useSpaceStore } from '@/stores/space.store'
import {
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  DoorOpen,
  FileText,
  Mail,
  MapPin,
  Phone,
  Receipt,
  User as UserIcon,
  X,
} from '@lucide/vue'

const props = defineProps<{ show: boolean; booking: Booking | null }>()

const emit = defineEmits<{ close: [] }>()

const spaceStore = useSpaceStore()

const fullSpace = ref<Space | null>(null)

const space = computed<Space | null>(() => fullSpace.value ?? (props.booking?.space as Space | null) ?? null)

watch(
  () => props.booking?.id,
  async () => {
    fullSpace.value = null
    const booking = props.booking
    if (!booking) return
    try {
      fullSpace.value = await spaceStore.ensureSpace(booking.spaceId)
    } catch {
      fullSpace.value = null
    }
  },
  { immediate: true },
)

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

const statusHeaderStyles: Record<string, string> = {
  PENDING: 'bg-gradient-to-br from-amber-500 to-amber-400',
  CONFIRMED: 'bg-gradient-to-br from-green-600 to-green-500',
  CANCELLED: 'bg-gradient-to-br from-red-600 to-red-500',
}

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

function formatHour(value?: string | null) {
  return value ? value.slice(0, 5) : '—'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show && booking"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <div class="px-6 py-2 sm:px-8" :class="statusHeaderStyles[booking.status]">
            <div class="flex items-center justify-between gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
                  <DoorOpen :size="22" />
                </div>
                <div class="min-w-0">
                  <h2 class="truncate text-xl font-semibold text-white">{{ space?.name ?? 'Espacio' }}</h2>
                  <p class="truncate text-sm text-white/80">{{ space?.description || 'Sin descripción' }}</p>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button
                  class="rounded-xl p-2 text-white/90 transition hover:bg-white/20 hover:text-white"
                  @click="emit('close')"
                >
                  <X :size="20" />
                </button>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
            <div class="space-y-6">
              <section>
                <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <DoorOpen :size="13" />
                  Espacio
                </p>
                <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div class="rounded-xl bg-gray-50 px-3.5 py-3">
                    <p class="text-xs text-gray-500">Capacidad</p>
                    <p class="mt-1 truncate font-medium text-gray-900">{{ space?.capacity ? `${space.capacity} personas` : '—' }}</p>
                  </div>
                  <div class="rounded-xl bg-gray-50 px-3.5 py-3">
                    <p class="text-xs text-gray-500">Precio</p>
                    <p class="mt-1 truncate font-medium text-gray-900">{{ space?.priceHour ? `$${space.priceHour}/hora` : '—' }}</p>
                  </div>
                </div>
                <div v-if="space?.amenities?.length" class="mt-3 flex flex-wrap gap-1.5">
                  <span
                    v-for="a in space.amenities"
                    :key="a.id"
                    class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                  >
                    <Check :size="12" />
                    {{ a.name }}
                  </span>
                </div>
              </section>

              <section>
                <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Calendar :size="13" />
                  Reserva
                </p>
                <div class="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div class="rounded-xl bg-gray-50 px-3.5 py-3">
                    <p class="text-xs text-gray-500">Fecha</p>
                    <p class="mt-1 flex items-center gap-1.5 font-medium text-gray-900">
                      <Calendar :size="14" class="shrink-0 text-gray-400" />
                      {{ booking.date ?? 'Por completar' }}
                    </p>
                  </div>
                  <div class="rounded-xl bg-gray-50 px-3.5 py-3">
                    <p class="text-xs text-gray-500">Horario</p>
                    <p class="mt-1 flex items-center gap-1.5 font-medium text-gray-900">
                      <Clock :size="14" class="shrink-0 text-gray-400" />
                      {{ booking.startTime ? `${formatHour(booking.startTime)} - ${formatHour(booking.endTime)}` : 'Por completar' }}
                    </p>
                  </div>
                  <div class="rounded-xl bg-gray-50 px-3.5 py-3">
                    <p class="text-xs text-gray-500">Creada</p>
                    <p class="mt-1 flex items-center gap-1.5 font-medium text-gray-900">
                      <CalendarCheck :size="14" class="shrink-0 text-gray-400" />
                      {{ formatDate(booking.createdAt) }}
                    </p>
                  </div>
                </div>
              </section>

              <section v-if="booking.billing?.billingName">
                <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <Receipt :size="13" />
                  Facturación
                </p>
                <div class="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl bg-gray-50/60 p-4 text-sm sm:grid-cols-2">
                  <div class="flex items-center gap-1.5 text-gray-600">
                    <UserIcon :size="13" class="shrink-0 text-gray-400" />
                    <span class="shrink-0 text-gray-400">Nombre:</span>
                    <span class="truncate font-medium text-gray-900">{{ booking.billing.billingName }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-gray-600">
                    <FileText :size="13" class="shrink-0 text-gray-400" />
                    <span class="shrink-0 text-gray-400">RUC/CI:</span>
                    <span class="truncate font-medium text-gray-900">{{ booking.billing.billingDocument }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-gray-600">
                    <Mail :size="13" class="shrink-0 text-gray-400" />
                    <span class="shrink-0 text-gray-400">Email:</span>
                    <span class="truncate font-medium text-gray-900">{{ booking.billing.billingEmail }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-gray-600">
                    <Phone :size="13" class="shrink-0 text-gray-400" />
                    <span class="shrink-0 text-gray-400">Teléfono:</span>
                    <span class="truncate font-medium text-gray-900">{{ booking.billing.billingPhone }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-gray-600 sm:col-span-2">
                    <MapPin :size="13" class="shrink-0 text-gray-400" />
                    <span class="shrink-0 text-gray-400">Dirección:</span>
                    <span class="truncate font-medium text-gray-900">{{ booking.billing.billingAddress }}</span>
                  </div>
                </div>
              </section>

              <section class="flex items-center justify-between rounded-2xl px-5 py-2 text-white" :class="statusHeaderStyles[booking.status]">
                <span class="flex items-center gap-2 text-sm font-medium text-white/90">
                  <Receipt :size="16" />
                  Total a pagar
                </span>
                <span class="text-xl font-bold">{{ booking.totalPrice ? `$${booking.totalPrice}` : '—' }}</span>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
