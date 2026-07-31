<script setup lang="ts">
import { Motion } from "motion-v";
import { Search, Plus } from "@lucide/vue";
import MouseGlowBackground from "@/components/MouseGlowBackground.vue";

defineProps<{
  title: string;
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
        <div class="mx-auto max-w-7xl px-4 py-1 sm:px-6 sm:py-2">
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
          </Motion>

          <Motion
            :initial="{ opacity: 0, y: -10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.1, duration: 0.4 }"
            class="mt-4 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="relative w-full sm:flex-1 md:max-w-56">
              <Search
                :size="17"
                class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="searchQuery"
                :placeholder="searchPlaceholder ?? 'Buscar...'"
                class="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <button
              v-if="addLabel"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
              @click="emit('add')"
            >
              <Plus :size="17" />
              {{ addLabel }}
            </button>
          </Motion>
        </div>
      </div>

      <div class="flex min-h-0 flex-1 overflow-hidden">
        <div
          class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-4 sm:px-6 md:flex-row md:gap-6"
        >
          <aside
            v-if="$slots.filters"
            class="shrink-0 md:sticky md:top-0 md:w-56 md:self-start"
          >
            <slot name="filters" />
          </aside>

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
