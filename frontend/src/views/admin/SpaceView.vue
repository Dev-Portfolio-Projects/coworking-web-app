<script setup lang="ts">
import AdminPageLayout from "@/components/AdminPageLayout.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import FormModal from "@/components/FormModal.vue";
import { useSpaceStore } from "@/stores/space.store";
import {
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    DoorOpen,
    List,
    Pencil,
    Save,
    Tag,
    Trash2,
    Users,
    XCircle,
} from "@lucide/vue";
import { Motion } from "motion-v";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const spaceStore = useSpaceStore();

const search = ref("");
const statusFilter = ref<"ALL" | "AVAILABLE" | "UNAVAILABLE">("ALL");

const filtered = computed(() => {
  let items = spaceStore.spaces;
  if (search.value) {
    const q = search.value.toLowerCase();
    items = items.filter((s) => s.name.toLowerCase().includes(q));
  }
  if (statusFilter.value !== "ALL") {
    items = items.filter((s) => s.status === statusFilter.value);
  }
  return items;
});

const cardPage = ref(1);
const cardsPerPage = ref<number>(6);
const totalCardPages = computed(() =>
  filtered.value.length > 0
    ? Math.ceil(filtered.value.length / cardsPerPage.value)
    : 0,
);
const paginatedCards = computed(() => {
  if (cardsPerPage.value === Infinity) return filtered.value;
  const start = (cardPage.value - 1) * cardsPerPage.value;
  return filtered.value.slice(start, start + cardsPerPage.value);
});
watch([search, statusFilter, cardsPerPage], () => {
  cardPage.value = 1;
});
watch(totalCardPages, (total) => {
  if (cardPage.value > total) {
    cardPage.value = Math.max(total, 1);
  }
});

const showForm = ref(false);
const editingSpace = ref<number | null>(null);
const saving = ref(false);
const formName = ref("");
const formDescription = ref("");
const formCapacity = ref(1);
const formPriceHour = ref(0);
const formStatus = ref<"AVAILABLE" | "UNAVAILABLE">("AVAILABLE");
const openStatus = ref(false);
const statusSelectRef = ref<HTMLElement | null>(null);

function onDocumentClick(event: MouseEvent) {
  if (statusSelectRef.value && !statusSelectRef.value.contains(event.target as Node)) {
    openStatus.value = false;
  }
}

onMounted(() => document.addEventListener("click", onDocumentClick));
onUnmounted(() => document.removeEventListener("click", onDocumentClick));
const formAmenityIds = ref<number[]>([]);

const amenityPage = ref(0);
const isMobile = ref(window.innerWidth < 640);
function onResize() {
  isMobile.value = window.innerWidth < 640;
}
onMounted(() => window.addEventListener("resize", onResize));
onUnmounted(() => window.removeEventListener("resize", onResize));

const amenitiesPerPage = computed(() => (isMobile.value ? 1 : 2));
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
  openStatus.value = false;
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
  openStatus.value = false;
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

function confirmDelete(id: number) {
  deletingId.value = id;
  showConfirm.value = true;
}

async function handleDelete() {
  if (deletingId.value === null) return;
  deleting.value = true;
  try {
    await spaceStore.deleteSpace(deletingId.value);
    cardPage.value = 1;
    showConfirm.value = false;
    deletingId.value = null;
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  spaceStore.fetchSpaces();
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
      <Motion
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{
          duration: 0.35,
          ease: 'easeOut',
        }"
      >
        <div
          class="flex flex-row flex-wrap justify-between gap-2 md:flex-col md:gap-2"
        >
          <button
            class="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition md:w-full md:flex-none md:text-left"
            :class="
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="statusFilter = 'ALL'"
          >
            <List :size="15" class="mr-1.5 inline" />Todos
          </button>
          <button
            class="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition md:w-full md:flex-none md:text-left"
            :class="
              statusFilter === 'AVAILABLE'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="statusFilter = 'AVAILABLE'"
          >
            <CheckCircle :size="15" class="mr-1.5 inline" />Disponible
          </button>
          <button
            class="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition md:w-full md:flex-none md:text-left"
            :class="
              statusFilter === 'UNAVAILABLE'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="statusFilter = 'UNAVAILABLE'"
          >
            <XCircle :size="15" class="mr-1.5 inline" />No disponible
          </button>
        </div>
      </Motion>
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
        v-else-if="filtered.length === 0"
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
          <div
            class="grid gap-4 pb-4 max-[900px]:grid-cols-1 min-[901px]:grid-cols-2 xl:grid-cols-3"
          >
            <Motion
              v-for="(s, i) in paginatedCards"
              :key="s.id"
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.04, duration: 0.3 }"
            >
              <div
                class="rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-semibold text-gray-900">{{ s.name }}</h3>
                    <p class="mt-1 line-clamp-2 text-sm text-gray-500">
                      {{ s.description }}
                    </p>
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

                <div class="mt-3 flex gap-3 text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <Users :size="14" class="text-gray-400" /> {{ s.capacity }}
                  </span>
                  <span class="flex items-center gap-1">
                    <DollarSign :size="14" class="text-gray-400" />
                    {{ s.priceHour }}/h
                  </span>
                </div>

                <div
                  v-if="s.amenities?.length"
                  class="mt-2 flex flex-wrap gap-1"
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

                <div class="mt-4 flex justify-end gap-2">
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
            </Motion>
          </div>
        </div>

        <div
          v-if="!spaceStore.loading && filtered.length > 0"
          class="mt-7 mb-4 shrink-0 flex flex-wrap items-center justify-between gap-3 border rounded-xl border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-xl"
        >
          <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>Mostrar:</span>
            <button
              v-for="n in [6, 12, 24]"
              :key="n"
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
              :class="
                cardsPerPage === n
                  ? 'bg-blue-100 font-medium text-blue-700'
                  : 'hover:bg-gray-100 text-gray-600'
              "
              @click="cardsPerPage = n"
            >
              {{ n }}
            </button>
            <button
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
              :class="
                cardsPerPage === Infinity
                  ? 'bg-blue-100 font-medium text-blue-700'
                  : 'hover:bg-gray-100 text-gray-600'
              "
              @click="cardsPerPage = Infinity"
            >
              Todos
            </button>
          </div>

          <div class="flex items-center gap-3 text-sm text-gray-500">
            <div v-if="totalCardPages > 1" class="flex items-center gap-1">
              <button
                :disabled="cardPage === 1"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                @click="cardPage = Math.max(1, cardPage - 1)"
              >
                <ChevronLeft :size="16" />
              </button>
              <button
                v-for="p in totalCardPages"
                :key="p"
                class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2.5 text-sm font-medium transition"
                :class="
                  cardPage === p
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                "
                @click="cardPage = p"
              >
                {{ p }}
              </button>
              <button
                :disabled="cardPage === totalCardPages"
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                @click="cardPage = Math.min(totalCardPages, cardPage + 1)"
              >
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </div>
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
        <div>
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
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700"
            >Descripción</label
          >
          <textarea
            v-model="formDescription"
            required
            rows="1"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            placeholder="Descripción del espacio..."
          />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700"
            >Estado</label
          >
          <div class="relative" ref="statusSelectRef">
            <button
              type="button"
              class="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              @click="openStatus = !openStatus"
            >
              <span>{{
                formStatus === "AVAILABLE" ? "Disponible" : "No disponible"
              }}</span>
              <ChevronDown
                :size="17"
                class="text-gray-400 transition"
                :class="{ 'rotate-180': openStatus }"
              />
            </button>
            <Transition name="dropdown">
              <div
                v-if="openStatus"
                class="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
              >
                <button
                  type="button"
                  class="flex w-full px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  :class="{
                    'font-medium text-gray-900': formStatus === 'AVAILABLE',
                  }"
                  @click="
                    formStatus = 'AVAILABLE';
                    openStatus = false;
                  "
                >
                  Disponible
                </button>
                <button
                  type="button"
                  class="flex w-full px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  :class="{
                    'font-medium text-gray-900': formStatus === 'UNAVAILABLE',
                  }"
                  @click="
                    formStatus = 'UNAVAILABLE';
                    openStatus = false;
                  "
                >
                  No disponible
                </button>
              </div>
            </Transition>
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
              <div class="grid grid-cols-2 gap-2">
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
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

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
