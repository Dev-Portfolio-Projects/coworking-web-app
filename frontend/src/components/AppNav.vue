<script setup lang="ts">
import { useAuthStore } from "@/stores/auth.store";
import { useRouter, useRoute } from "vue-router";
import { ref, computed } from "vue";
import { motion, Motion } from "motion-v";
import { Building2, DoorOpen, Boxes, LogIn, User, LogOut, Users, Menu, X } from "@lucide/vue";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const mobileOpen = ref(false);

function handleLogout() {
  auth.logout();
  mobileOpen.value = false;
  router.push("/");
}

function navigate(path: string) {
  mobileOpen.value = false;
  router.push(path);
}

const roleName = (id?: number) => ({ 1: 'Admin', 2: 'Staff', 3: 'Cliente' }[id ?? 3] ?? '')

const adminTabs = computed(() => [
  { label: 'Usuarios', path: '/admin/usuarios', icon: Users },
  { label: 'Espacios', path: '/admin/espacios', icon: DoorOpen },
  { label: 'Recursos', path: '/admin/recursos', icon: Boxes },
])

const activeTab = computed(() => adminTabs.value.find(t => route.path.startsWith(t.path))?.path ?? null)
</script>

<template>
  <nav class="border-b border-gray-200 bg-white/80 backdrop-blur-md">
    <Motion
      as="div"
      class="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 sm:py-3"
      :initial="{ opacity: 0, y: -20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.5, ease: 'easeOut' }"
    >
      <div class="flex items-center gap-6">
        <Motion :whileHover="{ scale: 1.05 }">
          <router-link
            to="/"
            class="flex items-center gap-2 text-base font-bold tracking-tight text-gray-900 transition-all duration-300 hover:text-blue-600"
            @click="mobileOpen = false"
          >
            <Building2 :size="20" />
            <span class="hidden sm:inline">WorkPlace</span>
            <span class="sm:hidden">WP</span>
          </router-link>
        </Motion>

        <div class="hidden sm:block">
          <template v-if="auth.user && auth.role === 1">
            <div class="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
              <motion.button
                v-for="tab in adminTabs"
                :key="tab.path"
                @click="navigate(tab.path)"
                class="relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                :class="activeTab === tab.path ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'"
              >
                <component :is="tab.icon" :size="17" />
                {{ tab.label }}
                <motion.div
                  v-if="activeTab === tab.path"
                  layout-id="admin-tab-underline"
                  class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600"
                />
              </motion.button>
            </div>
          </template>

          <template v-else-if="!auth.isAuthenticated">
            <div class="flex items-center gap-3 text-sm">
              <Motion whileHover="hover" :variants="{ hover: { y: -2 } }">
                <router-link
                  to="/catalog"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <DoorOpen :size="17" />
                  Espacios
                </router-link>
              </Motion>
            </div>
          </template>
        </div>
      </div>

      <div class="hidden sm:flex items-center gap-3 text-sm">
        <template v-if="auth.user">
          <div class="flex items-center gap-2.5 rounded-xl px-3 py-1.5">
            <div class="flex flex-col text-right">
              <span class="text-sm font-medium leading-tight text-gray-900">{{ auth.user.name }}</span>
              <span class="text-xs leading-tight text-gray-500">{{ roleName(auth.role) }}</span>
            </div>
          </div>

          <Motion whileHover="hover" :variants="{ hover: { y: -2, scale: 1.03 } }">
            <button
              class="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-red-50 hover:text-red-600"
              @click="handleLogout"
            >
              <LogOut :size="17" />
              Salir
            </button>
          </Motion>
        </template>

        <template v-else-if="!auth.isAuthenticated">
          <Motion whileHover="hover" :variants="{ hover: { y: -2 } }">
            <router-link
              to="/login"
              class="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <LogIn :size="17" />
              Iniciar sesión
            </router-link>
          </Motion>
        </template>
      </div>

      <button
        class="flex sm:hidden items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100"
        @click="mobileOpen = !mobileOpen"
      >
        <component :is="mobileOpen ? X : Menu" :size="20" />
      </button>
    </Motion>

    <Transition name="mobile-menu">
      <div v-if="mobileOpen" class="border-t border-gray-200 bg-white sm:hidden">
        <div class="space-y-1 px-4 pb-4 pt-2">
          <template v-if="auth.user && auth.role === 1">
            <button
              v-for="tab in adminTabs"
              :key="tab.path"
              @click="navigate(tab.path)"
              class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition"
              :class="activeTab === tab.path ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
            >
              <component :is="tab.icon" :size="18" />
              {{ tab.label }}
            </button>
          </template>

          <template v-else-if="!auth.isAuthenticated">
            <button
              @click="navigate('/catalog')"
              class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              <DoorOpen :size="18" />
              Espacios
            </button>
          </template>

          <hr class="my-2 border-gray-100">

          <template v-if="auth.user">
            <div class="flex items-center gap-3 px-4 py-3 text-sm text-gray-600">
              <div class="flex flex-col">
                <span class="font-medium leading-tight text-gray-900">{{ auth.user.name }}</span>
                <span class="text-xs leading-tight text-gray-500">{{ roleName(auth.role) }}</span>
              </div>
            </div>
            <button
              @click="handleLogout"
              class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <LogOut :size="18" />
              Cerrar sesión
            </button>
          </template>

          <template v-else-if="!auth.isAuthenticated">
            <button
              @click="navigate('/login')"
              class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
            >
              <LogIn :size="18" />
              Iniciar sesión
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </nav>
</template>

<style scoped>
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.25s ease;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
