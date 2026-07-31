<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { Motion } from "motion-v";
import { Mail, Lock, LogIn, ArrowRight, LoaderCircle } from "@lucide/vue";
import MouseGlowBackground from "@/components/MouseGlowBackground.vue";
import { useRetryButton } from "@/composables/useRetryButton";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");

const { isLoading, isBlocked, cooldownRemaining, execute } = useRetryButton('login');

const buttonState = computed(() => {
  if (isBlocked.value) return "blocked";
  if (isLoading.value) return "loading";
  return "idle";
});

async function handleSubmit() {
  await execute(async () => {
    await auth.login(email.value, password.value);
    router.push("/");
  });
}
</script>

<template>
  <MouseGlowBackground>
    <div class="relative h-full overflow-hidden">
      <section
        class="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-center px-6 py-5"
      >
        <Motion
          class="w-full max-w-md"
          :initial="{
            opacity: 0,
            scale: 0.97,
          }"
          :animate="{
            opacity: 1,
            scale: 1,
          }"
          :transition="{
            duration: 0.8,
          }"
        >
          <div
            class="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-xl"
          >
            <h1
              class="text-center text-2xl font-bold tracking-tight text-gray-900"
            >
              Bienvenido a WorkPlace
            </h1>

            <p class="mt-2 text-center text-sm text-gray-500">
              Accede a tu espacio de coworking
            </p>

            <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>

                <div class="relative">
                  <Mail
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    :size="18"
                  />

                  <input
                    v-model="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Contraseña
                </label>

                <div class="relative">
                  <Lock
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    :size="18"
                  />

                  <input
                    v-model="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              <Motion
                :whileHover="{
                  scale: isLoading || isBlocked ? 1 : 1.03,
                }"
                :whileTap="{
                  scale: isLoading || isBlocked ? 1 : 0.97,
                }"
              >
                <button
                  type="submit"
                  :disabled="isLoading || isBlocked"
                  class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-medium text-white transition hover:bg-blue-700"
                  :class="{
                    'cursor-not-allowed opacity-70': isLoading || isBlocked,
                  }"
                >
                  <Motion
                    :key="buttonState"
                    :initial="{
                      opacity: 0,
                      y: 4,
                    }"
                    :animate="{
                      opacity: 1,
                      y: 0,
                    }"
                    :transition="{
                      duration: 0.2,
                    }"
                    class="flex items-center gap-2"
                  >
                    <template v-if="isLoading">
                      <LoaderCircle class="animate-spin" :size="18" />

                      Ingresando...
                    </template>

                    <template v-else-if="isBlocked">
                      <Motion
                        :key="'cd-' + cooldownRemaining"
                        :initial="{
                          opacity: 0,
                          scale: 0.8,
                        }"
                        :animate="{
                          opacity: 1,
                          scale: 1,
                        }"
                        :transition="{
                          duration: 0.15,
                        }"
                      >
                        Disponible en {{ cooldownRemaining }}s
                      </Motion>
                    </template>

                    <template v-else>
                      <LogIn :size="18" />

                      Ingresar
                    </template>
                  </Motion>
                </button>
              </Motion>
            </form>

            <p class="mt-6 text-center text-sm text-gray-500">
              ¿No tienes cuenta?

              <router-link
                to="/register"
                class="inline-flex items-center gap-1 font-medium text-blue-600 transition hover:text-blue-700"
              >
                Regístrate

                <ArrowRight :size="15" />
              </router-link>
            </p>
          </div>
        </Motion>
      </section>
    </div>
  </MouseGlowBackground>
</template>
