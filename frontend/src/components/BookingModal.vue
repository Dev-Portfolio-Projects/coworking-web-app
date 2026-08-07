<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import {
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  DollarSign,
  DoorOpen,
  FileText,
  Mail,
  MapPin,
  Phone,
  Receipt,
  User as UserIcon,
  Users,
  XCircle,
} from '@lucide/vue'
import { useBookingStore } from '@/stores/booking.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSpaceStore } from '@/stores/space.store'
import { useUserStore } from '@/stores/user.store'
import type { Booking } from '@/services/booking.service'
import type { Space, AvailabilitySlot } from '@/services/space.service'
import SelectDropdown from '@/components/SelectDropdown.vue'

const props = defineProps<{
  show: boolean
  space: Space | null
  booking: Booking | null
  adminCreate?: boolean
}>()

const emit = defineEmits<{
  close: []
  created: []
}>()

const bookingStore = useBookingStore()
const auth = useAuthStore()
const spaceStore = useSpaceStore()
const userStore = useUserStore()

const isAdminCreate = computed(() => props.adminCreate ?? false)

const needsSelection = computed(
  () => isAdminCreate.value && (!formUserId.value || !formSpaceId.value),
)

const activeTab = ref<'datos' | 'facturacion'>('datos')

const formSpaceId = ref<number | null>(null)
const formUserId = ref<number | null>(null)
const formDate = ref('')
const formStartTime = ref('')
const formEndTime = ref('')

const billingName = ref('')
const billingDocument = ref('')
const billingEmail = ref('')
const billingPhone = ref('')
const billingAddress = ref('')

const saving = ref(false)
const error = ref('')

const availabilitySlots = ref<AvailabilitySlot[]>([])
const availabilityLoading = ref(false)
const selectedSlotId = ref<number | null>(null)

const isPreReservation = computed(() => !!props.booking)

const fetchedSpace = ref<Space | null>(null)

const displaySpace = computed<Space | null>(() => {
  if (props.space) return props.space
  if (fetchedSpace.value) return fetchedSpace.value
  if (props.booking?.space) return props.booking.space as Space
  if (formSpaceId.value) {
    return spaceStore.spaces.find((s) => s.id === formSpaceId.value) ?? null
  }
  return null
})

async function loadFullSpace(spaceId: number) {
  fetchedSpace.value = await spaceStore.ensureSpace(spaceId)
}

const selectedSpace = computed<Space | null>(() => {
  if (displaySpace.value) return displaySpace.value
  return spaceStore.spaces.find((s) => s.id === formSpaceId.value) ?? null
})

const spaceOptions = computed(() =>
  spaceStore.spaces.map((s) => ({
    value: s.id,
    label: `${s.name} - $${s.priceHour}/h`,
  })),
)

const userOptions = computed(() =>
  userStore.users
    .filter((u) => u.roleId === 3)
    .map((u) => ({
      value: u.id,
      label: `${u.name} · ${u.email}`,
    })),
)

const availableDates = computed(() => {
  const set = new Set<string>()
  for (const s of availabilitySlots.value) {
    if (!s.booked) set.add(s.availableDate)
  }
  return [...set].sort()
})

const slotsForSelectedDate = computed(() => {
  if (!formDate.value) return []
  return availabilitySlots.value
    .filter((s) => s.availableDate === formDate.value && !s.booked)
    .sort((a, b) => (a.startTime < b.startTime ? -1 : 1))
})

const selectedSlot = computed(() => slotsForSelectedDate.value.find((s) => s.id === selectedSlotId.value) ?? null)

const hasAvailability = computed(() => availabilitySlots.value.some((s) => !s.booked))

const datosValid = computed(() => {
  if (isAdminCreate.value && !formUserId.value) return false
  if (isAdminCreate.value && !formSpaceId.value) return false
  return !!formDate.value && !!selectedSlot.value
})

const billingComplete = computed(
  () =>
    billingName.value.trim().length >= 2 &&
    billingDocument.value.trim().length >= 6 &&
    /\S+@\S+\.\S+/.test(billingEmail.value.trim()) &&
    billingPhone.value.trim().length >= 6 &&
    billingAddress.value.trim().length >= 4,
)

const canSubmit = computed(() => datosValid.value && billingComplete.value && !saving.value)

const estimatedTotal = computed(() => {
  if (!selectedSpace.value || !formStartTime.value || !formEndTime.value) return null
  const start = formStartTime.value.split(':').map(Number)
  const end = formEndTime.value.split(':').map(Number)
  const hours = end[0] + end[1] / 60 - (start[0] + start[1] / 60)
  if (hours <= 0) return null
  return (Number(selectedSpace.value.priceHour) * hours).toFixed(2)
})

function formatDateOption(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
}

const dateOptions = computed(() => availableDates.value.map((d) => ({ value: d, label: formatDateOption(d) })))

const slotOptions = computed(() =>
  slotsForSelectedDate.value.map((s) => ({
    value: s.id,
    label: `${s.startTime.slice(0, 5)} - ${s.endTime.slice(0, 5)}`,
  })),
)

const visibleAmenities = computed(() => displaySpace.value?.amenities?.slice(0, 2) ?? [])

const extraAmenitiesCount = computed(() => {
  const amenities = displaySpace.value?.amenities ?? []
  return Math.max(0, amenities.length - 2)
})

function preselectAvailability() {
  const dates = availableDates.value
  if (dates.length === 0) {
    if (formDate.value) formDate.value = ''
    return
  }
  if (!formDate.value || !dates.includes(formDate.value)) {
    formDate.value = dates[0]
    return
  }
  const current = slotsForSelectedDate.value
  if (current.length > 0 && !selectedSlot.value) {
    selectedSlotId.value = current[0].id
  }
}

async function loadAvailability(spaceId: number) {
  availabilitySlots.value = []
  selectedSlotId.value = null
  formDate.value = ''
  formStartTime.value = ''
  formEndTime.value = ''
  availabilityLoading.value = true
  const cached = spaceStore.getCachedAvailability(spaceId)
  if (cached) {
    availabilitySlots.value = cached
    availabilityLoading.value = false
    preselectAvailability()
    spaceStore
      .fetchAvailabilityCached(spaceId, true)
      .then((fresh) => {
        availabilitySlots.value = fresh
        preselectAvailability()
      })
      .catch(() => {})
    return
  }
  try {
    availabilitySlots.value = await spaceStore.fetchAvailabilityCached(spaceId)
    preselectAvailability()
  } catch {
    availabilitySlots.value = []
  } finally {
    availabilityLoading.value = false
  }
}

watch(availabilitySlots, preselectAvailability)

watch(formDate, () => {
  selectedSlotId.value = null
  const first = slotsForSelectedDate.value[0]
  selectedSlotId.value = first ? first.id : null
})

watch(selectedSlotId, () => {
  if (selectedSlot.value) {
    formStartTime.value = selectedSlot.value.startTime.slice(0, 5)
    formEndTime.value = selectedSlot.value.endTime.slice(0, 5)
  } else {
    formStartTime.value = ''
    formEndTime.value = ''
  }
})

watch(
  () => formSpaceId.value,
  (id) => {
    if (id) loadAvailability(id)
  },
)

watch(formUserId, (id) => {
  const u = userStore.users.find((x) => x.id === id)
  if (u) {
    billingName.value = u.name
    billingEmail.value = u.email
  }
})

function resetForm() {
  activeTab.value = 'datos'
  formSpaceId.value = props.booking?.spaceId ?? props.space?.id ?? null
  formUserId.value = props.booking?.userId ?? null
  formDate.value = ''
  formStartTime.value = ''
  formEndTime.value = ''
  selectedSlotId.value = null
  billingName.value =
    props.booking?.billing?.billingName || props.booking?.user?.name || auth.user?.name || ''
  billingEmail.value =
    props.booking?.billing?.billingEmail || props.booking?.user?.email || auth.user?.email || ''
  billingDocument.value = props.booking?.billing?.billingDocument ?? ''
  billingPhone.value = props.booking?.billing?.billingPhone ?? ''
  billingAddress.value = props.booking?.billing?.billingAddress ?? ''
  saving.value = false
  error.value = ''
  availabilitySlots.value = []
}

watch(
  () => props.show,
  (open) => {
    if (open) {
      resetForm()
      fetchedSpace.value = null
      const spaceId = props.booking?.spaceId ?? props.space?.id
      if (!props.space && props.booking) {
        loadFullSpace(props.booking.spaceId)
      } else if (!props.space) {
        spaceStore.fetchSpaces({ status: 'AVAILABLE', limit: 0 })
      }
      if (isAdminCreate.value) {
        userStore.fetchUsers({ limit: 0 })
      }
      if (spaceId) {
        loadAvailability(spaceId)
      }
    }
  },
)

async function handleSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  error.value = ''
  try {
    const payload = {
      date: formDate.value,
      startTime: formStartTime.value,
      endTime: formEndTime.value,
      billingName: billingName.value.trim(),
      billingDocument: billingDocument.value.trim(),
      billingEmail: billingEmail.value.trim(),
      billingPhone: billingPhone.value.trim(),
      billingAddress: billingAddress.value.trim(),
    }
    if (isPreReservation.value) {
      await bookingStore.completeBooking(props.booking!.id, payload)
    } else {
      await bookingStore.createBooking({
        spaceId: selectedSpace.value!.id,
        ...(isAdminCreate.value ? { userId: formUserId.value ?? undefined } : {}),
        ...payload,
      })
    }
    spaceStore.invalidateAvailability(selectedSpace.value!.id)
    emit('created')
    emit('close')
  } catch (e: unknown) {
    const message =
      typeof e === 'object' && e !== null && 'response' in e
        ? ((e as { response: { data?: { message?: string } } }).response?.data?.message ?? 'No se pudo crear la reserva')
        : 'No se pudo crear la reserva'
    error.value = message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          class="mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        >
          <div class="flex items-center justify-between px-6 py-4 sm:px-8">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Reservar espacio</h2>
              <p class="mt-0.5 text-sm text-gray-500">
                {{
                  isPreReservation && !isAdminCreate
                    ? 'Tu pre-reserva ya está guardada. Completa los datos para confirmarla.'
                    : 'Completa los datos y la facturación'
                }}
              </p>
            </div>
            <button
              class="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>

          <div
            v-if="isAdminCreate && !isPreReservation"
            class="grid grid-cols-1 gap-4 px-6 pt-4 sm:grid-cols-2 sm:px-8"
          >
            <SelectDropdown
              v-model="formUserId"
              :options="userOptions"
              placeholder="Selecciona un usuario"
              :disabled="userStore.loading"
            >
              <template #icon>
                <UserIcon :size="17" class="shrink-0 text-gray-400" />
              </template>
            </SelectDropdown>
            <SelectDropdown
              v-model="formSpaceId"
              :options="spaceOptions"
              placeholder="Selecciona un espacio"
            >
              <template #icon>
                <DoorOpen :size="17" class="shrink-0 text-gray-400" />
              </template>
            </SelectDropdown>
          </div>

          <div v-if="!needsSelection" class="px-6 pt-4 sm:px-8">
            <div class="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                class="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition"
                :class="activeTab === 'datos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                @click="activeTab = 'datos'"
              >
                <CalendarCheck :size="16" />
                <span class="hidden sm:inline">Datos</span>
                <span class="sm:hidden">Datos</span>
              </button>
              <button
                type="button"
                class="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition"
                :class="activeTab === 'facturacion' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                @click="activeTab = 'facturacion'"
              >
                <Receipt :size="16" />
                <span class="hidden sm:inline">Facturación</span>
                <span class="sm:hidden">Facturación</span>
              </button>
            </div>
          </div>

          <div
            v-if="needsSelection"
            class="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 sm:px-8"
          >
            <div
              class="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500"
            >
              <DoorOpen :size="32" />
            </div>
            <p class="max-w-xs text-center text-sm text-gray-500">
              Selecciona un usuario y un espacio arriba para continuar.
            </p>
          </div>

          <div v-else class="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
            <form id="booking-form" class="space-y-6" @submit.prevent="handleSubmit">
              <section v-if="activeTab === 'datos'">
                <div
                  v-if="availabilityLoading"
                  class="flex flex-col items-center justify-center gap-3 py-16"
                >
                  <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  <p class="text-sm text-gray-500">Cargando datos disponibles...</p>
                </div>
                <div
                  v-else
                  class="grid grid-cols-1 gap-6 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
                >
                  <div class="pr-0 sm:pr-6">
                    <template v-if="displaySpace">
                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-gray-700">{{ displaySpace.name }}</label>
                        <p v-if="displaySpace.description" class="mt-0.5 line-clamp-2 text-sm text-gray-500">
                          {{ displaySpace.description }}
                        </p>
                      </div>

                      <div class="mt-4 space-y-2 text-sm">
                        <div
                          v-if="displaySpace.capacity"
                          class="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5"
                        >
                          <span class="flex items-center gap-1.5 text-gray-500">
                            <Users :size="14" />
                            Capacidad
                          </span>
                          <span class="font-semibold text-gray-900">{{ displaySpace.capacity }} personas</span>
                        </div>
                        <div class="flex items-center justify-between rounded-xl bg-blue-50/60 px-3.5 py-2.5">
                          <span class="flex items-center gap-1.5 text-blue-500">
                            <DollarSign :size="14" />
                            Precio
                          </span>
                          <span class="font-semibold text-gray-900">${{ displaySpace.priceHour }} /hora</span>
                        </div>
                      </div>

                      <div
                        v-if="displaySpace.amenities?.length"
                        class="mt-4 flex flex-wrap items-center gap-1.5"
                      >
                        <span
                          v-for="a in visibleAmenities"
                          :key="a.id"
                          class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                        >
                          <Check :size="12" />
                          {{ a.name }}
                        </span>
                        <span
                          v-if="extraAmenitiesCount > 0"
                          class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500"
                        >
                          +{{ extraAmenitiesCount }}
                        </span>
                      </div>
                    </template>

                    <div v-else-if="!isAdminCreate">
                      <SelectDropdown
                        v-model="formSpaceId"
                        :options="spaceOptions"
                        placeholder="Selecciona un espacio"
                      >
                        <template #icon>
                          <DoorOpen :size="17" class="shrink-0 text-gray-400" />
                        </template>
                      </SelectDropdown>
                    </div>

                    <div v-else class="flex flex-col items-center justify-center py-10 text-center">
                      <DoorOpen :size="32" class="text-gray-300" />
                      <p class="mt-3 text-sm text-gray-500">
                        Selecciona un usuario y un espacio arriba para continuar.
                      </p>
                    </div>
                  </div>

                  <div class="pt-6 sm:pl-6 sm:pt-0">
                    <div class="space-y-4">
                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-gray-700">Fecha</label>
                        <SelectDropdown
                          v-model="formDate"
                          :options="dateOptions"
                          placeholder="Selecciona un día disponible"
                          :disabled="availableDates.length === 0 || availabilityLoading"
                        >
                          <template #icon>
                            <Calendar :size="17" class="shrink-0 text-gray-400" />
                          </template>
                        </SelectDropdown>
                      </div>
                      <div>
                        <label class="mb-1.5 block text-sm font-medium text-gray-700">Horario disponible</label>
                        <SelectDropdown
                          v-model="selectedSlotId"
                          :options="slotOptions"
                          placeholder="Selecciona un horario"
                          :disabled="slotsForSelectedDate.length === 0 || availabilityLoading"
                        >
                          <template #icon>
                            <Clock :size="17" class="shrink-0 text-gray-400" />
                          </template>
                        </SelectDropdown>
                      </div>

                      <div
                        v-if="!hasAvailability"
                        class="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
                      >
                        <Clock :size="17" class="shrink-0" />
                        Este espacio no tiene horarios disponibles por ahora.
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section v-else>


                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700">Nombre / Razón social</label>
                    <div class="relative">
                      <UserIcon :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input v-model="billingName" required class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="Nombre o razón social" />
                    </div>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700">RUC / CI</label>
                    <div class="relative">
                      <FileText :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input v-model="billingDocument" required class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="Número de documento" />
                    </div>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                    <div class="relative">
                      <Mail :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input v-model="billingEmail" type="email" required class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="correo@ejemplo.com" />
                    </div>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700">Teléfono</label>
                    <div class="relative">
                      <Phone :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input v-model="billingPhone" type="tel" required class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="Número de teléfono" />
                    </div>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="mb-1.5 block text-sm font-medium text-gray-700">Dirección</label>
                    <div class="relative">
                      <MapPin :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input v-model="billingAddress" required class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" placeholder="Dirección de facturación" />
                    </div>
                  </div>
                </div>
              </section>

              <div
                v-if="error"
                class="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                <XCircle :size="17" />
                {{ error }}
              </div>
            </form>
          </div>

          <div v-if="!needsSelection" class="px-6 py-4 sm:px-8">
            <div class="mb-3 flex items-center justify-between text-sm">
              <span class="text-gray-500">
                Total estimado
              </span>
              <span class="text-lg font-semibold text-gray-900">
                {{ estimatedTotal ? `$${estimatedTotal}` : '—' }}
              </span>
            </div>

            <button
              type="submit"
              form="booking-form"
              :disabled="!canSubmit"
              class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Motion
                v-if="saving"
                :animate="{ rotate: 360 }"
                :transition="{ duration: 1, repeat: Infinity, ease: 'linear' }"
              >
                <CalendarCheck :size="18" />
              </Motion>
              <CalendarCheck v-else :size="18" />
              {{ saving ? 'Reservando...' : 'Reservar' }}
            </button>
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
