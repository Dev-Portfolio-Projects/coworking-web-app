<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useAmenityStore } from "@/stores/amenity.store";
import { Motion } from "motion-v";
import {
  Pencil,
  Trash2,
  Boxes,
  Save,
  ChevronLeft,
  ChevronRight,
} from "@lucide/vue";
import AdminPageLayout from "@/components/AdminPageLayout.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import FormModal from "@/components/FormModal.vue";

const amenityStore = useAmenityStore();

const search = ref("");

const filtered = computed(() => {
  if (!search.value) return amenityStore.amenities;
  const q = search.value.toLowerCase();
  return amenityStore.amenities.filter((a) => a.name.toLowerCase().includes(q));
});

const cardPage = ref(1);
const cardsPerPage = ref(6);
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
watch([search, cardsPerPage], () => {
  cardPage.value = 1;
});

const showForm = ref(false);
const editingAmenity = ref<number | null>(null);
const saving = ref(false);
const formName = ref("");
const formDescription = ref("");

function openCreate() {
  editingAmenity.value = null;
  formName.value = "";
  formDescription.value = "";
  showForm.value = true;
}

function openEdit(id: number) {
  const a = amenityStore.amenities.find((x) => x.id === id);
  if (!a) return;
  editingAmenity.value = id;
  formName.value = a.name;
  formDescription.value = a.description ?? "";
  showForm.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = {
      name: formName.value,
      description: formDescription.value || undefined,
    };
    if (editingAmenity.value) {
      await amenityStore.updateAmenity(editingAmenity.value, payload);
    } else {
      await amenityStore.createAmenity(payload);
    }
    showForm.value = false;
  } finally {
    saving.value = false;
  }
}

const showConfirm = ref(false);
const deleting = ref(false);
const deletingId = ref<number | null>(null);
const deletingName = ref("");

function confirmDelete(id: number) {
  const a = amenityStore.amenities.find((x) => x.id === id);
  if (!a) return;
  deletingId.value = id;
  deletingName.value = a.name;
  showConfirm.value = true;
}

async function handleDelete() {
  if (deletingId.value === null) return;
  deleting.value = true;
  try {
    await amenityStore.deleteAmenity(deletingId.value);
    showConfirm.value = false;
    deletingId.value = null;
  } finally {
    deleting.value = false;
  }
}

onMounted(() => amenityStore.fetchAmenities());
</script>

<template>
  <AdminPageLayout
    title="Recursos"
    search-placeholder="Buscar por nombre..."
    add-label="Nuevo recurso"
    v-model:search="search"
    @add="openCreate"
  >
    <div class="flex h-full min-h-0 flex-1 flex-col">
      <div v-if="amenityStore.loading" class="flex justify-center pt-16">
        <Motion
          :animate="{ rotate: 360 }"
          :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"
          >
            <Boxes :size="24" />
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
          <Boxes :size="32" />
        </div>
        <p class="mt-4 text-lg font-medium text-gray-900">No hay recursos</p>
        <p class="mt-1 text-sm text-gray-500">
          Crea un nuevo recurso para empezar.
        </p>
      </div>

      <div v-else class="mt-7 flex min-h-0 flex-1 flex-col md:mt-0">
        <div class="scroll-area flex-1 min-h-0 overflow-y-auto pr-4">
          <div
            class="grid gap-4 pb-4 max-[900px]:grid-cols-1 min-[901px]:grid-cols-2 xl:grid-cols-3"
          >
            <Motion
              v-for="(a, i) in paginatedCards"
              :key="a.id"
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.04, duration: 0.3 }"
            >
              <div
                class="rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
                  >
                    <Boxes :size="20" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium text-gray-900">{{ a.name }}</p>
                    <p
                      v-if="a.description"
                      class="line-clamp-2 text-sm text-gray-500"
                    >
                      {{ a.description }}
                    </p>
                  </div>
                </div>
                <div class="mt-4 flex justify-end gap-2">
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
                    @click="openEdit(a.id)"
                  >
                    <Pencil :size="14" /> Editar
                  </button>
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-red-50 hover:text-red-600"
                    @click="confirmDelete(a.id)"
                  >
                    <Trash2 :size="14" /> Eliminar
                  </button>
                </div>
              </div>
            </Motion>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="!amenityStore.loading && filtered.length > 0"
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
  </AdminPageLayout>

  <FormModal
    :show="showForm"
    :title="editingAmenity ? 'Editar recurso' : 'Nuevo recurso'"
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
            <Boxes
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
            rows="3"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            placeholder="Descripción del recurso..."
          />
        </div>
        <button
          type="submit"
          :disabled="saving"
          class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save :size="18" />
          {{ editingAmenity ? "Actualizar" : "Crear recurso" }}
        </button>
      </form>
    </template>
  </FormModal>

  <ConfirmModal
    :show="showConfirm"
    title="Eliminar recurso"
    :message="`¿Eliminar ${deletingName}? Esta acción no se puede deshacer.`"
    :loading="deleting"
    @confirm="handleDelete"
    @cancel="showConfirm = false"
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
