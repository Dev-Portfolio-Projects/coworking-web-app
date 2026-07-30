<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "vue-router";
import { Motion } from "motion-v";
import { User, Mail, ShieldCheck, Building2 } from "@lucide/vue";
import MouseGlowBackground from "@/components/MouseGlowBackground.vue";

const auth = useAuthStore();
const router = useRouter();

const loading = ref(true);

onMounted(async () => {
  if (!auth.isAuthenticated) {
    router.push("/login");
    return;
  }

  try {
    await auth.fetchProfile();
  } catch {
    router.push("/login");
  } finally {
    loading.value = false;
  }
});

function roleName(roleId: number) {
  if (roleId === 1) return "Administrador";

  if (roleId === 2) return "Staff";

  return "Cliente";
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
            duration: 0.6,
          }"
        >
          <Motion
            v-if="loading"
            class="flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 bg-white/80 p-10 backdrop-blur-xl"
            :initial="{
              opacity: 0,
              scale: 0.95,
            }"
            :animate="{
              opacity: 1,
              scale: 1,
            }"
            :transition="{
              duration: 0.4,
            }"
          >
            <Motion
              :animate="{
                rotate: 360,
              }"
              :transition="{
                duration: 1.2,
                repeat: Infinity,
                ease: 'linear',
              }"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"
              >
                <Building2 :size="24" />
              </div>
            </Motion>

            <Motion
              :initial="{
                opacity: 0,
              }"
              :animate="{
                opacity: 1,
              }"
              :transition="{
                delay: 0.2,
              }"
            >
              <p class="text-sm font-medium text-gray-500">
                Cargando perfil...
              </p>
            </Motion>
          </Motion>

          <Motion
            v-else
            class="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-xl"
            :initial="{
              opacity: 0,
              scale: 0.97,
            }"
            :animate="{
              opacity: 1,
              scale: 1,
            }"
            :transition="{
              duration: 0.5,
            }"
          >
            <Motion
              class="mb-6 flex justify-center"
              :initial="{
                opacity: 0,
                scale: 0.8,
              }"
              :animate="{
                opacity: 1,
                scale: 1,
              }"
              :transition="{
                delay: 0.15,
                duration: 0.4,
              }"
            >
              <div
                class="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white"
              >
                <Building2 :size="32" />
              </div>
            </Motion>

            <h1
              class="text-center text-2xl font-bold tracking-tight text-gray-900"
            >
              Mi perfil
            </h1>

            <p class="mt-2 text-center text-sm text-gray-500">
              Gestiona tu información personal
            </p>

            <div v-if="auth.user" class="mt-8 space-y-4">
              <Motion
                v-for="(item, index) in [
                  {
                    label: 'Nombre',
                    value: auth.user.name,
                    icon: User,
                  },
                  {
                    label: 'Email',
                    value: auth.user.email,
                    icon: Mail,
                  },
                  {
                    label: 'Rol',
                    value: roleName(auth.user.roleId),
                    icon: ShieldCheck,
                  },
                ]"
                :key="item.label"
                class="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4"
                :initial="{
                  opacity: 0,
                  x: -15,
                }"
                :animate="{
                  opacity: 1,
                  x: 0,
                }"
                :transition="{
                  delay: 0.2 + index * 0.1,
                  duration: 0.35,
                }"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"
                  >
                    <component :is="item.icon" :size="18" />
                  </div>

                  <div>
                    <p class="text-xs text-gray-500">
                      {{ item.label }}
                    </p>

                    <p class="text-sm font-medium text-gray-900">
                      {{ item.value }}
                    </p>
                  </div>
                </div>
              </Motion>
            </div>
          </Motion>
        </Motion>
      </section>
    </div>
  </MouseGlowBackground>
</template>
