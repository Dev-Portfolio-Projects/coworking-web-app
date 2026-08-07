<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, Save, Trash2, X } from '@lucide/vue'
import { useSpaceStore } from '@/stores/space.store'
import type { AvailabilitySlotPayload } from '@/services/space.service'

const props = defineProps<{
  show: boolean
  spaceId: number
  spaceName: string
}>()

const emit = defineEmits<{ close: []; saved: [] }>()

const spaceStore = useSpaceStore()

const slots = ref<AvailabilitySlotPayload[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const today = ref(dateToString(new Date()))

const view = ref({ year: new Date().getFullYear(), month: new Date().getMonth() })
const selectedDate = ref(today.value)

const newStart = ref('09:00')
const newEnd = ref('11:00')
const slotError = ref('')

function dateToString(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

const monthLabel = computed(() => {
  const d = new Date(view.value.year, view.value.month, 1)
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
})

const calendarCells = computed(() => {
  const { year, month } = view.value
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = first.getDay()
  const prevDays = new Date(year, month, 0).getDate()
  const cells: { date: string; day: number; inMonth: boolean }[] = []
  for (let i = leading - 1; i >= 0; i--) {
    cells.push({ date: dateToString(new Date(year, month - 1, prevDays - i)), day: prevDays - i, inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: dateToString(new Date(year, month, d)), day: d, inMonth: true })
  }
  return cells
})

function hasSlots(date: string) {
  return slots.value.some((s) => s.availableDate === date)
}

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return ''
  return parseDate(selectedDate.value).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
})

const slotsForSelectedDate = computed(() =>
  slots.value
    .filter((s) => s.availableDate === selectedDate.value)
    .sort((a, b) => (a.startTime < b.startTime ? -1 : 1)),
)

const totalSlotsCount = computed(() => slots.value.length)
const totalDatesCount = computed(() => new Set(slots.value.map((s) => s.availableDate)).size)

function cellClasses(cell: { date: string; inMonth: boolean }) {
  const isSelected = cell.date === selectedDate.value
  const isToday = cell.date === today.value
  const isPast = cell.date < today.value
  return {
    'text-gray-400': !cell.inMonth || isPast,
    'text-gray-800': cell.inMonth && !isPast,
    'bg-blue-600 text-white font-semibold hover:bg-blue-600': isSelected,
    'hover:bg-blue-50': !isSelected && cell.inMonth && !isPast,
    'ring-1 ring-blue-300': isToday && !isSelected,
  }
}

function prevMonth() {
  view.value =
    view.value.month === 0
      ? { year: view.value.year - 1, month: 11 }
      : { year: view.value.year, month: view.value.month - 1 }
}

function nextMonth() {
  view.value =
    view.value.month === 11
      ? { year: view.value.year + 1, month: 0 }
      : { year: view.value.year, month: view.value.month + 1 }
}

function selectDate(date: string) {
  selectedDate.value = date
  const d = parseDate(date)
  view.value = { year: d.getFullYear(), month: d.getMonth() }
  slotError.value = ''
}

function addSlot() {
  slotError.value = ''
  if (!newStart.value || !newEnd.value) return
  if (newEnd.value <= newStart.value) {
    slotError.value = 'La hora de fin debe ser posterior a la hora de inicio'
    return
  }
  const duplicate = slots.value.some(
    (s) => s.availableDate === selectedDate.value && s.startTime === newStart.value && s.endTime === newEnd.value,
  )
  if (duplicate) {
    slotError.value = 'Ese horario ya está agregado'
    return
  }
  const overlaps = slots.value.some(
    (s) =>
      s.availableDate === selectedDate.value &&
      newStart.value < s.endTime &&
      s.startTime < newEnd.value,
  )
  if (overlaps) {
    slotError.value = 'Ese horario se cruza con otro horario de este día'
    return
  }
  slots.value.push({ availableDate: selectedDate.value, startTime: newStart.value, endTime: newEnd.value })
  slotError.value = ''
}

function removeSlot(availableDate: string, startTime: string, endTime: string) {
  slots.value = slots.value.filter(
    (s) => !(s.availableDate === availableDate && s.startTime === startTime && s.endTime === endTime),
  )
}

function removeDate(date: string) {
  slots.value = slots.value.filter((s) => s.availableDate !== date)
}

async function load() {
  if (!props.spaceId) return
  loading.value = true
  error.value = ''
  try {
    const existing = await spaceStore.fetchAvailability(props.spaceId)
    slots.value = existing.map((s) => ({
      availableDate: s.availableDate,
      startTime: s.startTime.slice(0, 5),
      endTime: s.endTime.slice(0, 5),
    }))
    const firstDate = slots.value.map((s) => s.availableDate).sort()[0]
    selectedDate.value = firstDate ?? today.value
    const d = parseDate(selectedDate.value)
    view.value = { year: d.getFullYear(), month: d.getMonth() }
  } catch {
    error.value = 'No se pudo cargar la disponibilidad'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.show,
  (open) => {
    if (open) {
      view.value = { year: new Date().getFullYear(), month: new Date().getMonth() }
      selectedDate.value = today.value
      slotError.value = ''
      load()
    }
  },
)

async function handleSave() {
  if (slots.value.length === 0) {
    error.value = 'Agrega al menos un horario disponible'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await spaceStore.saveAvailability(props.spaceId, slots.value)
    emit('saved')
    emit('close')
  } catch {
    error.value = 'No se pudo guardar la disponibilidad'
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
              <h2 class="text-xl font-semibold text-gray-900">Horarios disponibles</h2>
              <p class="mt-0.5 text-sm text-gray-500">
                {{ spaceName }} · {{ totalDatesCount }} días · {{ totalSlotsCount }} horarios
              </p>
            </div>
            <button
              class="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5 sm:px-8">
            <div v-if="loading" class="flex items-center justify-center py-16">
              <div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            </div>

            <template v-else>
              <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <div class="flex items-center justify-between">
                    <button
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      @click="prevMonth"
                    >
                      <ChevronLeft :size="18" />
                    </button>
                    <p class="text-sm font-semibold capitalize text-gray-900">{{ monthLabel }}</p>
                    <button
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      @click="nextMonth"
                    >
                      <ChevronRight :size="18" />
                    </button>
                  </div>

                  <div class="mt-3 grid grid-cols-7 gap-1">
                    <span
                      v-for="w in weekDays"
                      :key="w"
                      class="py-1 text-center text-[11px] font-medium uppercase text-gray-400"
                    >
                      {{ w }}
                    </span>
                    <button
                      v-for="cell in calendarCells"
                      :key="cell.date"
                      :disabled="cell.date < today"
                      class="relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition disabled:cursor-not-allowed"
                      :class="cellClasses(cell)"
                      @click="selectDate(cell.date)"
                    >
                      {{ cell.day }}
                      <span
                        v-if="hasSlots(cell.date)"
                        class="absolute bottom-1.5 h-1 w-1 rounded-full"
                        :class="selectedDate === cell.date ? 'bg-white' : 'bg-blue-600'"
                      />
                    </button>
                  </div>
                </div>

                <div class="lg:border-l lg:border-gray-200 lg:pl-6">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-semibold capitalize text-gray-900">{{ selectedDateLabel }}</p>
                    <button
                      v-if="slotsForSelectedDate.length > 0"
                      class="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      @click="removeDate(selectedDate)"
                    >
                      <Trash2 :size="13" />
                      Quitar día
                    </button>
                  </div>

                  <div v-if="slotsForSelectedDate.length" class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="s in slotsForSelectedDate"
                      :key="`${s.availableDate}-${s.startTime}-${s.endTime}`"
                      class="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700"
                    >
                      <Clock :size="13" />
                      {{ s.startTime }} - {{ s.endTime }}
                      <button
                        class="rounded-full p-0.5 text-blue-400 transition hover:bg-blue-200 hover:text-blue-700"
                        @click="removeSlot(s.availableDate, s.startTime, s.endTime)"
                      >
                        <X :size="13" />
                      </button>
                    </span>
                  </div>
                  <p v-else class="mt-3 text-sm text-gray-400">Sin horarios para este día.</p>

                  <div class="mt-4 border-t border-gray-200 pt-4">
                    <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Agregar horario a este día
                    </p>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-600">Inicio</label>
                        <input
                          v-model="newStart"
                          type="time"
                          class="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs font-medium text-gray-600">Fin</label>
                        <input
                          v-model="newEnd"
                          type="time"
                          class="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>
                    <p v-if="slotError" class="mt-2 text-xs font-medium text-red-600">{{ slotError }}</p>
                    <button
                      class="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                      @click="addSlot"
                    >
                      <Plus :size="15" />
                      Agregar horario
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="error" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {{ error }}
              </div>
            </template>
          </div>

          <div class="flex items-center justify-end gap-2 px-6 py-4 sm:px-8">
            <button
              class="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              @click="emit('close')"
            >
              Cancelar
            </button>
            <button
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="saving || slots.length === 0"
              @click="handleSave"
            >
              <Save :size="16" />
              {{ saving ? 'Guardando...' : 'Guardar horarios' }}
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
