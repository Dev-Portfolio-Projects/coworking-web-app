<script setup lang="ts">
import AdminPageLayout from "@/components/AdminPageLayout.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import FormModal from "@/components/FormModal.vue";
import AvailabilityModal from "@/components/AvailabilityModal.vue";
import { useSpaceStore } from "@/stores/space.store";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    DoorOpen,
    FileText,
    Pencil,
    Save,
    Tag,
    Trash2,
    Users,
} from "@lucide/vue";
import { Motion } from "motion-v";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import PaginationBar from "@/components/PaginationBar.vue";
import SelectDropdown from "@/components/SelectDropdown.vue";

const spaceStore = useSpaceStore();

const search = ref("");
const statusFilter = ref<"ALL" | "AVAILABLE" | "UNAVAILABLE">("ALL");

const statusFilterOptions = [
  { value: "ALL", label: "Todos los espacios" },
  { value: "AVAILABLE", label: "Disponibles" },
  { value: "UNAVAILABLE", label: "No disponibles" },
];

const page = ref(1);
const limit = ref(6);

function load() {
  spaceStore.fetchSpaces({
    status: statusFilter.value === "ALL" ? undefined : statusFilter.value,
    search: search.value || undefined,
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
watch(page, load);
watch(limit, () => {
  page.value = 1;
  load();
});
watch(
  () => spaceStore.totalPages,
  (totalPages) => {
    if (totalPages > 0 && page.value > totalPages) page.value = totalPages;
  },
);

const showForm = ref(false);
const editingSpace = ref<number | null>(null);
const saving = ref(false);
const formName = ref("");
const formDescription = ref("");
const formCapacity = ref(1);
const formPriceHour = ref(0);
const formStatus = ref<"AVAILABLE" | "UNAVAILABLE">("AVAILABLE");
const statusOptions = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "UNAVAILABLE", label: "No disponible" },
];
const formAmenityIds = ref<number[]>([]);

const amenityPage = ref(0);
const viewWidth = ref(window.innerWidth);
function onResize() {
  viewWidth.value = window.innerWidth;
}
onMounted(() => window.addEventListener("resize", onResize));
onUnmounted(() => window.removeEventListener("resize", onResize));

const amenitiesPerPage = computed(() => {
  if (viewWidth.value < 640) return 1;
  if (viewWidth.value < 1024) return 2;
  return 3;
});
const amenityTotalPages = computed(() =>
  Math.max(1, Math.ceil(spaceStore.amenities.length / amenitiesPerPage.value)),
);
const visibleAmenities = computed(() => {
  const start = amenityPage.value * amenitiesPerPage.value;
  return spaceStore.amenities.slice(start, start + amenitiesPerPage.value);
});

function openCreate() {
  editingSpace.value = null;
  formName.value = "";
  formDescription.value = "";
  formCapacity.value = 1;
  formPriceHour.value = 0;
  formStatus.value = "AVAILABLE";
  formAmenityIds.value = [];
  showForm.value = true;
  amenityPage.value = 0;
}

function openEdit(id: number) {
  const s = spaceStore.spaces.find((sp) => sp.id === id);
  if (!s) return;
  editingSpace.value = id;
  formName.value = s.name;
  formDescription.value = s.description;
  formCapacity.value = s.capacity;
  formPriceHour.value = Number(s.priceHour);
  formStatus.value = s.status;
  formAmenityIds.value = s.amenities?.map((a) => a.id) ?? [];
  showForm.value = true;
  amenityPage.value = 0;
}

function toggleAmenity(id: number) {
  const idx = formAmenityIds.value.indexOf(id);
  if (idx === -1) formAmenityIds.value.push(id);
  else formAmenityIds.value.splice(idx, 1);
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = {
      name: formName.value,
      description: formDescription.value,
      capacity: formCapacity.value,
      priceHour: formPriceHour.value,
      status: formStatus.value,
      amenityIds: formAmenityIds.value,
    };
    if (editingSpace.value) {
      await spaceStore.updateSpace(editingSpace.value, payload);
    } else {
      await spaceStore.createSpace(payload);
    }
    showForm.value = false;
  } finally {
    saving.value = false;
  }
}

const showConfirm = ref(false);
const deleting = ref(false);
const deletingId = ref<number | null>(null);

const showAvailability = ref(false);
const availabilitySpace = ref<{ id: number; name: string } | null>(null);

function openAvailability(id: number, name: string) {
  availabilitySpace.value = { id, name };
  showAvailability.value = true;
}

function confirmDelete(id: number) {
  deletingId.value = id;
  showConfirm.value = true;
}

async function handleDelete() {
  if (deletingId.value === null) return;
  deleting.value = true;
  try {
    await spaceStore.deleteSpace(deletingId.value);
    page.value = 1;
    showConfirm.value = false;
    deletingId.value = null;
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  load();
  spaceStore.fetchAmenities();
});
</script>

<template>
  <AdminPageLayout
    title="Espacios"
    search-placeholder="Buscar por nombre..."
    add-label="Nuevo espacio"
    v-model:search="search"
    @add="openCreate"
  >
    <template #filters>
      <SelectDropdown
        v-model="statusFilter"
        :options="statusFilterOptions"
        trigger-class="h-10 w-full sm:w-56"
      />
    </template>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        v-if="spaceStore.loading"
        class="flex flex-1 items-center justify-center"
      >
        <Motion
          :animate="{ rotate: 360 }"
          :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"
          >
            <DoorOpen :size="24" />
          </div>
        </Motion>
      </div>

      <div
        v-else-if="spaceStore.spaces.length === 0"
        class="flex flex-col items-center justify-center pt-16 text-center"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"
        >
          <DoorOpen :size="32" />
        </div>
        <p class="mt-4 text-lg font-medium text-gray-900">No hay espacios</p>
        <p class="mt-1 text-sm text-gray-500">
          Crea un nuevo espacio para empezar.
        </p>
      </div>

      <div v-else class="mt-7 flex min-h-0 flex-1 flex-col md:mt-0">
        <div class="scroll-area flex-1 min-h-0 overflow-y-auto pr-4">
          <div class="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
            <Motion
              v-for="(s, i) in spaceStore.spaces"
              :key="s.id"
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
                    <h3 class="truncate text-lg font-semibold text-gray-900">{{ s.name }}</h3>
                  </div>
                  <span
                    class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="
                      s.status === 'AVAILABLE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    "
                  >
                    {{
                      s.status === "AVAILABLE" ? "Disponible" : "No disponible"
                    }}
                  </span>
                </div>

                <div class="mt-4 space-y-3 rounded-xl bg-gray-50 px-4 py-3">
                  <p class="flex items-center gap-2.5 text-sm text-gray-900">
                    <FileText :size="18" class="shrink-0 text-gray-400" />
                    <span class="truncate">{{ s.description }}</span>
                  </p>
                  <div class="grid grid-cols-2 gap-3">
                    <p class="flex items-center gap-2.5 text-sm text-gray-900">
                      <Users :size="18" class="shrink-0 text-gray-400" />
                      <span class="truncate">{{ s.capacity }}</span>
                    </p>
                    <p class="flex items-center gap-2.5 text-sm text-gray-900">
                      <DollarSign :size="18" class="shrink-0 text-gray-400" />
                      <span class="truncate">{{ s.priceHour }}/h</span>
                    </p>
                  </div>
                </div>

                <div
                  v-if="s.amenities?.length"
                  class="mt-3 flex flex-wrap gap-1"
                >
                  <span
                    v-for="a in s.amenities.slice(0, 2)"
                    :key="a.id"
                    class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                    :title="a.description"
                  >
                    {{ a.name }}
                  </span>

                  <span
                    v-if="s.amenities.length > 2"
                    class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                    :title="`${s.amenities.length - 2} recursos más`"
                  >
                    +{{ s.amenities.length - 2 }}
                  </span>
                </div>

                <div class="mt-auto">
                  <div class="flex items-center justify-around gap-2 pt-4">
                    <button
                      class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
                      @click="openAvailability(s.id, s.name)"
                    >
                      <Calendar :size="14" /> Horarios
                    </button>
                    <button
                      class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
                      @click="openEdit(s.id)"
                    >
                      <Pencil :size="14" /> Editar
                    </button>
                    <button
                      class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-red-50 hover:text-red-600"
                      @click="confirmDelete(s.id)"
                    >
                      <Trash2 :size="14" /> Eliminar
                    </button>
                  </div>
                </div>
              </article>
            </Motion>
          </div>
        </div>

        <PaginationBar
          v-if="!spaceStore.loading && spaceStore.spaces.length > 0"
          v-model:page="page"
          v-model:limit="limit"
          :total-pages="spaceStore.totalPages"
          :total="spaceStore.total"
        />
      </div>
    </div>
  </AdminPageLayout>

  <FormModal
    :show="showForm"
    :title="editingSpace ? 'Editar espacio' : 'Nuevo espacio'"
    :saving="saving"
    @close="showForm = false"
  >
    <template #default="{ saving }">
      <form class="space-y-4" @submit.prevent="handleSave">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div class="sm:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-gray-700"
              >Nombre</label
            >
            <div class="relative">
              <Tag
                :size="17"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="formName"
                required
                class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1.5 block text-sm font-medium text-gray-700"
              >Estado</label
            >
            <SelectDropdown v-model="formStatus" :options="statusOptions" />
          </div>
          <div class="sm:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-gray-700"
              >Descripción</label
            >
            <textarea
              v-model="formDescription"
              required
              rows="5"
              class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              placeholder="Descripción del espacio..."
            />
          </div>
          <div class="flex flex-col gap-4 sm:col-span-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700"
                >Capacidad</label
              >
              <div class="relative">
                <Users
                  :size="17"
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  v-model.number="formCapacity"
                  type="number"
                  min="1"
                  required
                  class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700"
                >Precio por hora</label
              >
              <div class="relative">
                <DollarSign
                  :size="17"
                  class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  v-model.number="formPriceHour"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-if="spaceStore.amenities.length > 0">
          <label class="mb-3 block text-sm font-medium text-gray-700"
            >Recursos</label
          >
          <div class="relative">
            <Motion
              :key="amenityPage"
              :initial="{ opacity: 0, x: 20 }"
              :animate="{ opacity: 1, x: 0 }"
              :transition="{ duration: 0.25 }"
            >
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <label
                  v-for="a in visibleAmenities"
                  :key="a.id"
                  class="flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-4 text-sm transition-all duration-200"
                  :class="
                    formAmenityIds.includes(a.id)
                      ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-200/50 scale-[1.02]'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                  "
                >
                  <input
                    type="checkbox"
                    :checked="formAmenityIds.includes(a.id)"
                    @change="toggleAmenity(a.id)"
                    class="hidden"
                  />
                  <span
                    class="truncate font-medium"
                    :class="
                      formAmenityIds.includes(a.id)
                        ? 'text-blue-700'
                        : 'text-gray-900'
                    "
                    >{{ a.name }}</span
                  >
                </label>
              </div>
            </Motion>
            <div
              v-if="amenityTotalPages > 1"
              class="mt-3 flex items-center justify-between"
            >
              <button
                type="button"
                :disabled="amenityPage === 0"
                class="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="amenityPage--"
              >
                <ChevronLeft :size="16" />
              </button>
              <div class="flex items-center gap-1.5">
                <button
                  v-for="p in amenityTotalPages"
                  :key="p"
                  type="button"
                  class="h-2 rounded-full transition-all"
                  :class="
                    amenityPage === p - 1
                      ? 'bg-blue-600 w-5'
                      : 'bg-gray-300 w-2 hover:bg-gray-400'
                  "
                  @click="amenityPage = p - 1"
                />
              </div>
              <button
                type="button"
                :disabled="amenityPage >= amenityTotalPages - 1"
                class="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="amenityPage++"
              >
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </div>
        <button
          type="submit"
          :disabled="saving"
          class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save :size="18" />
          {{ editingSpace ? "Actualizar" : "Crear espacio" }}
        </button>
      </form>
    </template>
  </FormModal>

  <ConfirmModal
    :show="showConfirm"
    title="Eliminar espacio"
    message="¿Eliminar este espacio? Esta acción no se puede deshacer."
    :loading="deleting"
    @confirm="handleDelete"
    @cancel="showConfirm = false"
  />

  <AvailabilityModal
    :show="showAvailability"
    :space-id="availabilitySpace?.id ?? 0"
    :space-name="availabilitySpace?.name ?? ''"
    @close="showAvailability = false"
    @saved="showAvailability = false"
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
