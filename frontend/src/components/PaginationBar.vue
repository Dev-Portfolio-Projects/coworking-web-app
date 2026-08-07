<script setup lang="ts">
import { computed } from "vue";
import { ChevronLeft, ChevronRight } from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    pageSizeOptions?: number[];
  }>(),
  {
    pageSizeOptions: () => [6, 12, 24],
  },
);

const emit = defineEmits<{
  "update:page": [page: number];
  "update:limit": [limit: number];
}>();

const pageNumbers = computed<(number | "...")[]>(() => {
  const total = props.totalPages;
  const current = props.page;
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
});
</script>

<template>
  <div
    v-if="total > 0"
    class="mt-4 mb-3 shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-xl"
  >
    <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500">
      <span>Mostrar:</span>
      <button
        v-for="n in pageSizeOptions"
        :key="n"
        class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
        :class="
          limit === n
            ? 'bg-blue-100 font-medium text-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
        "
        @click="emit('update:limit', n)"
      >
        {{ n }}
      </button>
      <span class="ml-1 hidden sm:inline">{{ total }} elemento{{ total === 1 ? "" : "s" }}</span>
    </div>

    <div v-if="totalPages > 1" class="flex items-center gap-1">
      <button
        :disabled="page === 1"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        @click="emit('update:page', Math.max(1, page - 1))"
      >
        <ChevronLeft :size="16" />
      </button>
      <button
        v-for="p in pageNumbers"
        :key="p"
        :disabled="p === '...'"
        class="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2.5 text-sm font-medium transition"
        :class="
          p === '...'
            ? 'cursor-default text-gray-400'
            : page === p
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
        "
        @click="emit('update:page', p as number)"
      >
        {{ p }}
      </button>
      <button
        :disabled="page === totalPages"
        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        @click="emit('update:page', Math.min(totalPages, page + 1))"
      >
        <ChevronRight :size="16" />
      </button>
    </div>
  </div>
</template>
