<script setup lang="ts">
import { Trash2, X } from '@lucide/vue'
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    show: boolean
    title: string
    message: string
    loading?: boolean
    confirmLabel?: string
    confirmIcon?: Component
  }>(),
  {
    loading: false,
    confirmLabel: 'Eliminar',
    confirmIcon: () => Trash2,
  },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        @click.self="emit('cancel')"
      >
        <div class="mx-4 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-5 shadow-xl sm:p-6">
          <h3 class="text-center text-lg font-semibold text-gray-900">{{ title }}</h3>
          <p class="mt-2 text-center text-sm text-gray-500">{{ message }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
              @click="emit('cancel')"
            >
              <X :size="16" />
              Cancelar
            </button>
            <button
              class="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading"
              @click="emit('confirm')"
            >
              <component :is="confirmIcon" :size="16" />
              {{ confirmLabel }}
            </button>
          </div>
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
