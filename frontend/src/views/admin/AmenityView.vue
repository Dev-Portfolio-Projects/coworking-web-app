<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAmenityStore } from "@/stores/amenity.store";
import { Motion } from "motion-v";
import { Pencil, Trash2, Boxes, Save, FileText } from "@lucide/vue";
import AdminPageLayout from "@/components/AdminPageLayout.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import FormModal from "@/components/FormModal.vue";
import PaginationBar from "@/components/PaginationBar.vue";

const amenityStore = useAmenityStore();

const search = ref("");
const page = ref(1);
const limit = ref(6);

function load() {
  amenityStore.fetchAmenities({
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

watch(page, load);
watch(limit, () => {
  page.value = 1;
  load();
});
watch(
  () => amenityStore.totalPages,
  (totalPages) => {
    if (totalPages > 0 && page.value > totalPages) page.value = totalPages;
  },
);

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
    page.value = 1;
    showConfirm.value = false;
    deletingId.value = null;
  } finally {
    deleting.value = false;
  }
}

onMounted(() => load());
</script>

<template>
  <AdminPageLayout
    title="Recursos"
    search-placeholder="Buscar por nombre..."
    add-label="Nuevo recurso"
    v-model:search="search"
    @add="openCreate"
  >
    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        v-if="amenityStore.loading"
        class="flex flex-1 items-center justify-center"
      >
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
        v-else-if="amenityStore.amenities.length === 0"
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
            class="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <Motion
              v-for="(a, i) in amenityStore.amenities"
              :key="a.id"
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.04, duration: 0.3 }"
              class="h-full"
            >
              <article
                class="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg sm:p-6"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
                  >
                    <Boxes :size="18" />
                  </span>
                  <h3 class="truncate text-lg font-semibold text-gray-900">{{ a.name }}</h3>
                </div>

                <div class="mt-4 flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
                  <FileText :size="18" class="shrink-0 text-gray-400" />
                  <p class="truncate text-sm text-gray-900">
                    {{ a.description || "Sin descripción" }}
                  </p>
                </div>

                <div class="mt-auto">
                  <div class="flex items-center justify-end gap-2 pt-4">
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
              </article>
            </Motion>
          </div>
        </div>

        <PaginationBar
          v-if="!amenityStore.loading && amenityStore.amenities.length > 0"
          v-model:page="page"
          v-model:limit="limit"
          :total-pages="amenityStore.totalPages"
          :total="amenityStore.total"
        />
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
