<script setup lang="ts" generic="T extends string | number | null">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ChevronDown } from '@lucide/vue'

export interface SelectOption<T> {
  value: T
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: T
    options: SelectOption<T>[]
    placeholder?: string
    triggerClass?: string
    panelClass?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'Seleccionar',
    triggerClass: 'h-11 w-full',
    panelClass: '',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref({ left: '0px', top: '0px', width: '0px' })

const selectedOption = computed<SelectOption<T> | null>(
  () => props.options.find((o) => String(o.value) === String(props.modelValue)) ?? null,
)

const triggerLabel = computed(() => selectedOption.value?.label ?? props.placeholder)

function updatePanelPosition() {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const panelHeight = panelRef.value?.offsetHeight ?? 0
  let top = rect.bottom + 4
  if (top + panelHeight > window.innerHeight) {
    top = Math.max(8, rect.top - panelHeight - 4)
  }
  panelStyle.value = {
    left: `${rect.left}px`,
    top: `${top}px`,
    width: `${rect.width}px`,
  }
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    void nextTick(updatePanelPosition)
  }
}

function select(option: SelectOption<T>) {
  emit('update:modelValue', option.value)
  open.value = false
}

function onDocumentClick(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

function onViewportChange() {
  if (open.value) updatePanelPosition()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('scroll', onViewportChange, true)
  window.addEventListener('resize', onViewportChange)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('scroll', onViewportChange, true)
  window.removeEventListener('resize', onViewportChange)
})

watch(
  () => props.modelValue,
  () => {
    open.value = false
  },
)
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      :class="[triggerClass, { 'text-gray-400': !selectedOption }]"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="flex min-w-0 items-center gap-2">
        <slot name="icon" />
        <span class="truncate">{{ triggerLabel }}</span>
      </span>
      <ChevronDown :size="17" class="ml-1 shrink-0 text-gray-400 transition" :class="{ 'rotate-180': open }" />
    </button>

    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="open"
          ref="panelRef"
          class="fixed z-[999] max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          :class="panelClass"
          :style="panelStyle"
        >
          <button
            v-for="opt in options"
            :key="String(opt.value)"
            type="button"
            class="flex w-full px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
            :class="{ 'font-medium text-gray-900': String(opt.value) === String(modelValue) }"
            @click="select(opt)"
          >
            {{ opt.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
