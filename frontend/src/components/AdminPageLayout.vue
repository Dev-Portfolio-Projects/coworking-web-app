<script setup lang="ts">
import { Motion } from "motion-v";
import { Search, Plus } from "@lucide/vue";
import MouseGlowBackground from "@/components/MouseGlowBackground.vue";

defineProps<{
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  addLabel?: string;
}>();

const searchQuery = defineModel<string>("search", { default: "" });
const emit = defineEmits<{ add: [] }>();
</script>

<template>
  <MouseGlowBackground>
    <div class="relative flex h-full min-h-0 flex-col">
      <div class="shrink-0">
        <div class="mx-auto w-full max-w-6xl px-6 py-5">
          <Motion
            :initial="{ opacity: 0, y: -15 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5 }"
          >
            <h1
              class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
            >
              {{ title }}
            </h1>
            <p
              v-if="subtitle"
              class="mt-2 text-sm text-gray-500 sm:text-base"
            >
              {{ subtitle }}
            </p>
          </Motion>

          <Motion
            :initial="{ opacity: 0, y: -10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.1, duration: 0.4 }"
          >
            <div class="mt-4 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/80 p-4 backdrop-blur-xl">
              <div class="flex flex-wrap items-center gap-2">
                <div class="relative w-full sm:min-w-[220px] sm:flex-1">
                  <Search
                    :size="16"
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    v-model="searchQuery"
                    :placeholder="searchPlaceholder ?? 'Buscar...'"
                    class="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <slot name="filters" />

                <button
                  v-if="addLabel"
                  class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
                  @click="emit('add')"
                >
                  <Plus :size="16" />
                  {{ addLabel }}
                </button>
              </div>
            </div>
          </Motion>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 overflow-hidden">
        <div class="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col px-6 pb-3">
          <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <Motion
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :transition="{ duration: 0.35 }"
              class="flex min-h-0 flex-1 flex-col"
            >
              <slot />
            </Motion>
          </div>
        </div>
      </div>
    </div>
  </MouseGlowBackground>
</template>
