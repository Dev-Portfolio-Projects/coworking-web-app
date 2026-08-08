<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useBookingStore } from "@/stores/booking.store";
import { useUserStore } from "@/stores/user.store";
import { Motion } from "motion-v";
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  DoorOpen,
  Mail,
  XCircle,
  CalendarDays,
  User as UserIcon,
} from "@lucide/vue";
import AdminPageLayout from "@/components/AdminPageLayout.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import SelectDropdown from "@/components/SelectDropdown.vue";
import BookingModal from "@/components/BookingModal.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import type { Booking } from "@/services/booking.service";

const bookingStore = useBookingStore();
const userStore = useUserStore();

const search = ref("");
const statusFilter = ref<string>("");
const userIdFilter = ref<number | null>(null);

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "PENDING", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmadas" },
  { value: "CANCELLED", label: "Canceladas" },
];

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
};

const userOptions = computed(() => [
  { value: null as number | null, label: "Todos los usuarios" },
  ...userStore.users
    .filter((u) => u.roleId === 3)
    .map((u) => ({ value: u.id, label: u.name })),
]);

const page = ref(1);
const limit = ref(6);

function load() {
  bookingStore.fetchAllBookings({
    status: statusFilter.value || undefined,
    search: search.value || undefined,
    userId: userIdFilter.value ?? undefined,
    page: page.value,
    limit: limit.value,
  });
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    load();
  }, 400);
});

watch(statusFilter, () => {
  page.value = 1;
  load();
});
watch(userIdFilter, () => {
  page.value = 1;
  load();
});
watch(page, load);
watch(limit, () => {
  page.value = 1;
  load();
});
watch(
  () => bookingStore.adminTotalPages,
  (totalPages) => {
    if (totalPages > 0 && page.value > totalPages) page.value = totalPages;
  },
);

const showCreate = ref(false);

function openCreate() {
  showCreate.value = true;
}

function onCreated() {
  showCreate.value = false;
  load();
}

const showConfirmModal = ref(false);
const confirmingBooking = ref<Booking | null>(null);

function openConfirm(b: Booking) {
  confirmingBooking.value = b;
  showConfirmModal.value = true;
}

function onConfirmCreated() {
  showConfirmModal.value = false;
  confirmingBooking.value = null;
  load();
}

const showCancelModal = ref(false);
const cancellingBooking = ref<Booking | null>(null);
const cancelling = ref(false);

function openCancel(b: Booking) {
  cancellingBooking.value = b;
  showCancelModal.value = true;
}

async function confirmCancel() {
  if (!cancellingBooking.value) return;
  cancelling.value = true;
  try {
    await bookingStore.cancelBooking(cancellingBooking.value.id);
    showCancelModal.value = false;
    cancellingBooking.value = null;
    load();
  } finally {
    cancelling.value = false;
  }
}

onMounted(() => {
  load();
  userStore.fetchUsers({ limit: 0 });
});
</script>

<template>
  <AdminPageLayout
    title="Reservas"
    search-placeholder="Buscar por usuario, espacio o ID..."
    add-label="Nueva reserva"
    v-model:search="search"
    @add="openCreate"
  >
    <template #filters>
      <SelectDropdown
        v-model="statusFilter"
        :options="statusOptions"
        trigger-class="h-10 w-full sm:w-56"
      />
      <SelectDropdown
        v-model="userIdFilter"
        :options="userOptions"
        trigger-class="h-10 w-full sm:w-56"
      />
    </template>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div v-if="bookingStore.loading" class="flex justify-center pt-16">
        <Motion
          :animate="{ rotate: 360 }"
          :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"
          >
            <Calendar :size="24" />
          </div>
        </Motion>
      </div>

      <div
        v-else-if="bookingStore.allBookings.length === 0"
        class="flex flex-col items-center justify-center pt-16 text-center"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"
        >
          <CalendarDays :size="32" />
        </div>
        <p class="mt-4 text-lg font-medium text-gray-900">No hay reservas</p>
        <p class="mt-1 text-sm text-gray-500">
          No se encontraron reservas con los filtros seleccionados.
        </p>
      </div>

      <div v-else class="mt-7 flex min-h-0 flex-1 flex-col md:mt-0">
        <div class="scroll-area flex-1 min-h-0 overflow-y-auto pr-4">
          <div
            class="grid gap-4 pb-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            <Motion
              v-for="(b, i) in bookingStore.allBookings"
              :key="b.id"
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.04, duration: 0.3 }"
              class="h-full"
            >
              <article
                class="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg sm:p-6"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-2.5">
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
                    >
                      <DoorOpen :size="18" />
                    </span>
                    <h3 class="truncate text-lg font-semibold text-gray-900">
                      {{ b.space?.name ?? "Espacio" }}
                    </h3>
                  </div>
                  <span
                    class="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="statusStyles[b.status]"
                  >
                    {{ statusLabel[b.status] }}
                  </span>
                </div>

                <div class="mt-4 space-y-3 rounded-xl bg-gray-50 px-4 py-3">
                  <p class="flex items-center gap-2.5 text-sm text-gray-900">
                    <UserIcon :size="18" class="shrink-0 text-gray-400" />
                    <span class="truncate">{{ b.user?.name ?? "Usuario" }}</span>
                  </p>
                  <p class="flex items-center gap-2.5 text-sm text-gray-900">
                    <Mail :size="18" class="shrink-0 text-gray-400" />
                    <span class="truncate">{{ b.user?.email ?? "—" }}</span>
                  </p>
                  <div class="grid grid-cols-2 gap-3 pt-3">
                    <p class="flex items-center gap-2.5 text-sm text-gray-900">
                      <Calendar :size="18" class="shrink-0 text-gray-400" />
                      <span class="truncate">{{ b.date ?? "—" }}</span>
                    </p>
                    <p class="flex items-center gap-2.5 text-sm text-gray-900">
                      <Clock :size="18" class="shrink-0 text-gray-400" />
                      <span class="truncate">
                        {{ b.startTime ? `${b.startTime.slice(0, 5)} - ${b.endTime?.slice(0, 5)}` : "—" }}
                      </span>
                    </p>
                  </div>
                </div>

                <div class="mt-auto">
                  <div class="flex items-center justify-between gap-2 pt-4">
                    <p class="flex items-center gap-1.5 text-sm text-gray-900">
                      <DollarSign :size="14" class="text-gray-400" />
                      {{ b.totalPrice ? `${b.totalPrice}` : "—" }}
                    </p>
                    <div class="flex items-center gap-2">
                      <button
                        v-if="b.status === 'PENDING'"
                        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
                        @click="openConfirm(b)"
                      >
                        <CheckCircle2 :size="14" /> Confirmar
                      </button>
                      <button
                        v-if="b.status !== 'CANCELLED'"
                        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-red-50 hover:text-red-600"
                        @click="openCancel(b)"
                      >
                        <XCircle :size="14" /> Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </Motion>
          </div>
        </div>
      </div>

      <PaginationBar
        v-if="!bookingStore.loading && bookingStore.allBookings.length > 0"
        v-model:page="page"
        v-model:limit="limit"
        :total-pages="bookingStore.adminTotalPages"
        :total="bookingStore.adminTotal"
      />
    </div>
  </AdminPageLayout>

  <BookingModal
    :show="showCreate"
    :space="null"
    :booking="null"
    admin-create
    @close="showCreate = false"
    @created="onCreated"
  />

  <BookingModal
    :show="showConfirmModal"
    :space="null"
    :booking="confirmingBooking"
    admin-create
    @close="showConfirmModal = false"
    @created="onConfirmCreated"
  />

  <ConfirmModal
    :show="showCancelModal"
    title="Cancelar reserva"
    :message="`¿Cancelar la reserva${cancellingBooking ? ` de ${cancellingBooking.user?.name ?? 'usuario'} en ${cancellingBooking.space?.name ?? 'espacio'}` : ''}?`"
    :loading="cancelling"
    confirm-label="Cancelar reserva"
    :confirm-icon="XCircle"
    @confirm="confirmCancel"
    @cancel="
      showCancelModal = false;
      cancellingBooking = null;
    "
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
