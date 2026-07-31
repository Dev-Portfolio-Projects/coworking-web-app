<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
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
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "@lucide/vue";
import AdminPageLayout from "@/components/AdminPageLayout.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import FormModal from "@/components/FormModal.vue";

const userStore = useUserStore();

type UserForm = {
  id: number;
  name: string;
  email: string;
  roleId: number;
};

const search = ref("");
const roleFilter = ref<number | null>(null);

const filtered = computed(() => {
  let items = userStore.users;
  if (search.value) {
    const q = search.value.toLowerCase();
    items = items.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }
  if (roleFilter.value !== null) {
    items = items.filter((u) => u.roleId === roleFilter.value);
  }
  return items;
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
watch([search, roleFilter, cardsPerPage], () => {
  cardPage.value = 1;
});

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

const filterColors: Record<string, string> = {
  all: "bg-blue-600 text-white",
  admin: "bg-purple-600 text-white",
  staff: "bg-blue-600 text-white",
  client: "bg-gray-800 text-white",
};

const showForm = ref(false);
const showConfirm = ref(false);
const saving = ref(false);
const deleting = ref(false);
const editingUser = ref<UserForm | null>(null);

const formName = ref("");
const formEmail = ref("");
const formPassword = ref("");
const formRoleId = ref(3);
const openRole = ref(false);
const roleSelectRef = ref<HTMLElement | null>(null);

function onDocumentClick(event: MouseEvent) {
  if (roleSelectRef.value && !roleSelectRef.value.contains(event.target as Node)) {
    openRole.value = false;
  }
}

onMounted(() => document.addEventListener("click", onDocumentClick));
onUnmounted(() => document.removeEventListener("click", onDocumentClick));

function openCreate() {
  openRole.value = false;
  editingUser.value = null;
  formName.value = "";
  formEmail.value = "";
  formPassword.value = "";
  formRoleId.value = 3;
  showForm.value = true;
}

function openEdit(u: UserForm) {
  openRole.value = false;
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
    openRole.value = false;
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!deletingUser.value) return;
  deleting.value = true;
  try {
    await userStore.deleteUser(deletingUser.value.id);
    cardPage.value = 1;
    showConfirm.value = false;
    deletingUser.value = null;
  } finally {
    deleting.value = false;
  }
}

onMounted(() => userStore.fetchUsers());
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
              roleFilter === null
                ? filterColors.all
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="roleFilter = null"
          >
            <List :size="15" class="mr-1.5 inline" />Todos
          </button>
          <button
            class="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition md:w-full md:flex-none md:text-left"
            :class="
              roleFilter === 1
                ? filterColors.admin
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="roleFilter = 1"
          >
            <Shield :size="15" class="mr-1.5 inline" />Admin
          </button>
          <button
            class="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition md:w-full md:flex-none md:text-left"
            :class="
              roleFilter === 2
                ? filterColors.staff
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="roleFilter = 2"
          >
            <Briefcase :size="15" class="mr-1.5 inline" />Staff
          </button>
          <button
            class="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition md:w-full md:flex-none md:text-left"
            :class="
              roleFilter === 3
                ? filterColors.client
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
            @click="roleFilter = 3"
          >
            <UserIcon :size="15" class="mr-1.5 inline" />Cliente
          </button>
        </div>
      </Motion>
    </template>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div v-if="userStore.loading" class="flex justify-center pt-16">
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
        v-else-if="filtered.length === 0"
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
          <div
            class="grid gap-4 pb-4 max-[900px]:grid-cols-1 min-[901px]:grid-cols-2 xl:grid-cols-3"
          >
            <Motion
              v-for="(u, i) in paginatedCards"
              :key="u.id"
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.04, duration: 0.3 }"
            >
              <div
                class="rounded-2xl border border-gray-200 bg-white/80 p-5 backdrop-blur-xl"
              >
                <div
                  class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      :class="{
                        'bg-purple-100 text-purple-600': u.roleId === 1,
                        'bg-blue-100 text-blue-600': u.roleId === 2,
                        'bg-gray-100 text-gray-600': u.roleId >= 3,
                      }"
                    >
                      <component :is="roleIcon(u.roleId)" :size="20" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-medium text-gray-900">
                        {{ u.name }}
                      </p>
                      <p class="truncate text-sm text-gray-500">
                        {{ u.email }}
                      </p>
                    </div>
                  </div>
                  <span
                    class="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="roleColor(u.roleId)"
                  >
                    <component :is="roleIcon(u.roleId)" :size="12" />
                    {{ roleName(u.roleId) }}
                  </span>
                </div>
                <div class="mt-4 flex justify-end gap-2">
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
            </Motion>
          </div>
        </div>
      </div>

      <div
        v-if="!userStore.loading && filtered.length > 0"
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
  </AdminPageLayout>

  <FormModal
    :show="showForm"
    :title="editingUser ? 'Editar usuario' : 'Nuevo usuario'"
    :saving="saving"
    @close="
      showForm = false;
      openRole = false;
    "
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
          <div class="relative" ref="roleSelectRef">
            <button
              type="button"
              class="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              @click="openRole = !openRole"
            >
              <span>{{ roleName(formRoleId) }}</span>
              <ChevronDown
                :size="17"
                class="text-gray-400 transition"
                :class="{ 'rotate-180': openRole }"
              />
            </button>
            <Transition name="dropdown">
              <div
                v-if="openRole"
                class="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
              >
                <button
                  type="button"
                  class="flex w-full px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  :class="{ 'font-medium text-gray-900': formRoleId === 1 }"
                  @click="
                    formRoleId = 1;
                    openRole = false;
                  "
                >
                  Admin
                </button>
                <button
                  type="button"
                  class="flex w-full px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  :class="{ 'font-medium text-gray-900': formRoleId === 2 }"
                  @click="
                    formRoleId = 2;
                    openRole = false;
                  "
                >
                  Staff
                </button>
                <button
                  type="button"
                  class="flex w-full px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  :class="{ 'font-medium text-gray-900': formRoleId === 3 }"
                  @click="
                    formRoleId = 3;
                    openRole = false;
                  "
                >
                  Cliente
                </button>
              </div>
            </Transition>
          </div>
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
