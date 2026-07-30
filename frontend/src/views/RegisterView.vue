<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { Motion } from "motion-v";
import { User, Mail, Lock, UserPlus, ArrowRight, Building2, LoaderCircle } from "@lucide/vue";
import MouseGlowBackground from "@/components/MouseGlowBackground.vue";
import { useRetryButton } from "@/composables/useRetryButton";

const router = useRouter();
const auth = useAuthStore();

const name = ref("");
const email = ref("");
const password = ref("");

const { isLoading, isBlocked, cooldownRemaining, execute } = useRetryButton('register');

const buttonState = computed(() => {
  if (isBlocked.value) return "blocked";
  if (isLoading.value) return "loading";
  return "idle";
});

async function handleSubmit() {
  await execute(async () => {
    await auth.register(email.value, password.value, name.value);
    router.push("/profile");
  });
}
</script>

<template>
  <MouseGlowBackground>
    <div class="relative h-full overflow-hidden">
      <section
        class="relative z-10 mx-auto flex h-full max-w-6xl items-center justify-center px-6"
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
            <Motion
              class="mb-6 flex justify-center"
              :initial="{
                scale: 0.8,
                opacity: 0,
              }"
              :animate="{
                scale: 1,
                opacity: 1,
              }"
              :transition="{
                delay: 0.2,
                duration: 0.5,
              }"
            >
              <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-white"
              >
                <Building2 :size="28" />
              </div>
            </Motion>

            <h1
              class="text-center text-2xl font-bold tracking-tight text-gray-900"
            >
              Crea tu cuenta
            </h1>

            <p class="mt-2 text-center text-sm text-gray-500">
              Únete a WorkPlace y reserva tu coworking
            </p>

            <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">
                  Nombre
                </label>

                <div class="relative">
                  <User
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    :size="18"
                  />

                  <input
                    v-model="name"
                    type="text"
                    placeholder="Tu nombre"
                    required
                    class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>
              </div>

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
                    class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
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
                    class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
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
                  class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 font-medium text-white transition hover:bg-orange-700"
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

                      Creando cuenta...
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
                      <UserPlus :size="18" />

                      Crear cuenta
                    </template>
                  </Motion>
                </button>
              </Motion>
            </form>

            <p class="mt-6 text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?

              <router-link
                to="/login"
                class="inline-flex items-center gap-1 font-medium text-orange-600 transition hover:text-orange-700"
              >
                Inicia sesión

                <ArrowRight :size="15" />
              </router-link>
            </p>
          </div>
        </Motion>
      </section>
    </div>
  </MouseGlowBackground>
</template>
