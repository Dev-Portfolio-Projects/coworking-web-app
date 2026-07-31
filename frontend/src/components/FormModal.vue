<script setup lang="ts">
defineProps<{ show: boolean; title: string; saving?: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">{{ title }}</h2>
            <button
              class="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>
          <slot :saving="saving" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
