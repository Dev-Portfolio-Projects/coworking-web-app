<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useUserStore } from "@/stores/user.store";
import { Motion } from "motion-v";
import {
  Pencil,
  Trash2,
  Users,
  Shield,
  User as UserIcon,
  Briefcase,
  Save,
  Mail,
  Lock,
} from "@lucide/vue";
import AdminPageLayout from "@/components/AdminPageLayout.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import FormModal from "@/components/FormModal.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import SelectDropdown from "@/components/SelectDropdown.vue";

const userStore = useUserStore();

type UserForm = {
  id: number;
  name: string;
  email: string;
  roleId: number;
};

const search = ref("");
const roleFilter = ref<number | null>(null);
const page = ref(1);
const limit = ref(6);

function load() {
  userStore.fetchUsers({
    search: search.value || undefined,
    roleId: roleFilter.value ?? undefined,
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

watch(roleFilter, () => {
  page.value = 1;
  load();
});
watch(page, load);
watch(limit, () => {
  page.value = 1;
  load();
});
watch(
  () => userStore.totalPages,
  (totalPages) => {
    if (totalPages > 0 && page.value > totalPages) page.value = totalPages;
  },
);

const roleName = (id: number) =>
  ({ 1: "Admin", 2: "Staff", 3: "Cliente" })[id] ?? "Desconocido";

const roleIcon = (id: number) =>
  id === 1 ? Shield : id === 2 ? Briefcase : UserIcon;

const roleColor = (id: number) =>
  id === 1
    ? "bg-purple-100 text-purple-700"
    : id === 2
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-700";

const roleFilterOptions = [
  { value: null, label: "Todos los roles" },
  { value: 1, label: "Admin" },
  { value: 2, label: "Staff" },
  { value: 3, label: "Cliente" },
];

const showForm = ref(false);
const showConfirm = ref(false);
const saving = ref(false);
const deleting = ref(false);
const editingUser = ref<UserForm | null>(null);

const formName = ref("");
const formEmail = ref("");
const formPassword = ref("");
const formRoleId = ref(3);

const roleOptions = [
  { value: 1, label: "Admin" },
  { value: 2, label: "Staff" },
  { value: 3, label: "Cliente" },
];

function openCreate() {
  editingUser.value = null;
  formName.value = "";
  formEmail.value = "";
  formPassword.value = "";
  formRoleId.value = 3;
  showForm.value = true;
}

function openEdit(u: UserForm) {
  editingUser.value = u;
  formName.value = u.name;
  formEmail.value = u.email;
  formPassword.value = "";
  formRoleId.value = u.roleId;
  showForm.value = true;
}

const deletingUser = ref<{ id: number; name: string } | null>(null);

function confirmDelete(u: { id: number; name: string }) {
  deletingUser.value = u;
  showConfirm.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (editingUser.value) {
      await userStore.updateUser(editingUser.value.id, {
        name: formName.value,
        email: formEmail.value,
        roleId: formRoleId.value,
        ...(formPassword.value ? { password: formPassword.value } : {}),
      });
    } else {
      await userStore.createUser({
        name: formName.value,
        email: formEmail.value,
        password: formPassword.value,
        roleId: formRoleId.value,
      });
    }
    showForm.value = false;
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!deletingUser.value) return;
  deleting.value = true;
  try {
    await userStore.deleteUser(deletingUser.value.id);
    page.value = 1;
    showConfirm.value = false;
    deletingUser.value = null;
  } finally {
    deleting.value = false;
  }
}

onMounted(() => load());
</script>

<template>
  <AdminPageLayout
    title="Usuarios"
    search-placeholder="Buscar por nombre o email..."
    add-label="Nuevo usuario"
    v-model:search="search"
    @add="openCreate"
  >
    <template #filters>
      <SelectDropdown
        v-model="roleFilter"
        :options="roleFilterOptions"
        trigger-class="h-10 w-full sm:w-56"
      />
    </template>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        v-if="userStore.loading"
        class="flex flex-1 items-center justify-center"
      >
        <Motion
          :animate="{ rotate: 360 }"
          :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"
          >
            <Users :size="24" />
          </div>
        </Motion>
      </div>

      <div
        v-else-if="userStore.users.length === 0"
        class="flex flex-col items-center justify-center pt-16 text-center"
      >
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400"
        >
          <Users :size="32" />
        </div>
        <p class="mt-4 text-lg font-medium text-gray-900">No hay usuarios</p>
        <p class="mt-1 text-sm text-gray-500">
          Crea un nuevo usuario para empezar.
        </p>
      </div>

      <div v-else class="mt-7 flex min-h-0 flex-1 flex-col md:mt-0">
        <div class="scroll-area flex-1 min-h-0 overflow-y-auto pr-4">
          <div class="grid grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3">
            <Motion
              v-for="(u, i) in userStore.users"
              :key="u.id"
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
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      :class="roleColor(u.roleId)"
                    >
                      <component :is="roleIcon(u.roleId)" :size="18" />
                    </span>
                    <h3 class="truncate text-lg font-semibold text-gray-900">{{ u.name }}</h3>
                  </div>
                  <span
                    class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600"
                  >
                    {{ roleName(u.roleId) }}
                  </span>
                </div>

                <div class="mt-4 flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
                  <Mail :size="18" class="shrink-0 text-gray-400" />
                  <p class="truncate text-sm text-gray-900">{{ u.email }}</p>
                </div>

                <div class="mt-auto">
                  <div class="flex items-center justify-end gap-2 pt-4">
                    <button
                      class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
                      @click="openEdit(u)"
                    >
                      <Pencil :size="14" /> Editar
                    </button>
                    <button
                      class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-red-50 hover:text-red-600"
                      @click="confirmDelete(u)"
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
          v-if="!userStore.loading && userStore.users.length > 0"
          v-model:page="page"
          v-model:limit="limit"
          :total-pages="userStore.totalPages"
          :total="userStore.total"
        />
      </div>
    </div>
  </AdminPageLayout>

  <FormModal
    :show="showForm"
    :title="editingUser ? 'Editar usuario' : 'Nuevo usuario'"
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
            <UserIcon
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
            >Email</label
          >
          <div class="relative">
            <Mail
              :size="17"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="formEmail"
              type="email"
              required
              class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700">
            {{
              editingUser
                ? "Contraseña (dejar vacío para mantener)"
                : "Contraseña"
            }}
          </label>
          <div class="relative">
            <Lock
              :size="17"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="formPassword"
              type="password"
              :required="!editingUser"
              class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700"
            >Rol</label
          >
          <SelectDropdown v-model="formRoleId" :options="roleOptions" />
        </div>
        <button
          type="submit"
          :disabled="saving"
          class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save :size="18" />
          {{ editingUser ? "Actualizar" : "Crear usuario" }}
        </button>
      </form>
    </template>
  </FormModal>

  <ConfirmModal
    :show="showConfirm"
    title="Eliminar usuario"
    :message="`¿Eliminar a ${deletingUser?.name}? Esta acción no se puede deshacer.`"
    :loading="deleting"
    @confirm="handleDelete"
    @cancel="
      showConfirm = false;
      deletingUser = null;
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
