<script setup lang="ts">
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";
import { Motion } from "motion-v";
import { Home, LogIn, User, LogOut } from "@lucide/vue";

const auth = useAuthStore();
const router = useRouter();

function handleLogout() {
  auth.logout();
  router.push("/");
}
</script>

<template>
  <nav
    class="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md"
  >
    <Motion
      as="div"
      class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
      :initial="{
        opacity: 0,
        y: -20,
      }"
      :animate="{
        opacity: 1,
        y: 0,
      }"
      :transition="{
        duration: 0.5,
        ease: 'easeOut',
      }"
    >
      <Motion
        :whileHover="{
          scale: 1.05,
        }"
      >
        <a
          href="https://www.linkedin.com/in/scedison"
          target="_blank"
          rel="noopener noreferrer"
          class="text-base tracking-wide text-gray-700 transition-all duration-300 hover:text-blue-600"
        >
          @scedison
        </a>
      </Motion>

      <div class="flex items-center gap-3 text-sm">
        <Motion
          whileHover="hover"
          :variants="{
            hover: {
              y: -2,
            },
          }"
        >
          <router-link
            to="/"
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <Home :size="17" />

            Inicio
          </router-link>
        </Motion>

        <Motion
          v-if="!auth.isAuthenticated"
          whileHover="hover"
          :variants="{
            hover: {
              y: -2,
            },
          }"
        >
          <router-link
            to="/login"
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-blue-50 hover:text-blue-600"
          >
            <LogIn :size="17" />

            Iniciar sesión
          </router-link>
        </Motion>

        <Motion
          v-if="auth.isAuthenticated"
          whileHover="hover"
          :variants="{
            hover: {
              y: -2,
            },
          }"
        >
          <router-link
            to="/profile"
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <User :size="17" />

            Mi perfil
          </router-link>
        </Motion>

        <Motion
          v-if="auth.isAuthenticated"
          whileHover="hover"
          :variants="{
            hover: {
              y: -2,
              scale: 1.03,
            },
          }"
        >
          <button
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-gray-600 transition hover:bg-red-50 hover:text-red-600"
            @click="handleLogout"
          >
            <LogOut :size="17" />

            Cerrar sesión
          </button>
        </Motion>
      </div>
    </Motion>
  </nav>
</template>
