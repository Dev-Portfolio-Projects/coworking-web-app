<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Motion } from 'motion-v'
import { Users, Boxes, DoorOpen, CalendarDays } from '@lucide/vue'
import MouseGlowBackground from '@/components/MouseGlowBackground.vue'

const router = useRouter()

const items = [
  { label: 'Usuarios', icon: Users, route: '/admin/usuarios', color: 'blue' },
  { label: 'Recursos', icon: Boxes, route: '/admin/recursos', color: 'purple' },
  { label: 'Espacios', icon: DoorOpen, route: '/admin/espacios', color: 'green' },
  { label: 'Reservas', icon: CalendarDays, route: '/admin/reservas', color: 'amber' },
]
</script>

<template>
  <MouseGlowBackground>
    <div class="relative h-full overflow-y-auto">
      <div class="relative z-10 mx-auto flex max-w-2xl items-center justify-center px-6 py-8" style="min-height: calc(100% - 4rem);">
        <div class="w-full">
          <div class="grid gap-4">
            <Motion
              v-for="(item, i) in items"
              :key="item.label"
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.08, duration: 0.4 }"
            >
              <button
                class="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white/80 p-5 text-left backdrop-blur-xl transition hover:shadow-lg"
                @click="router.push(item.route)"
              >
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-2xl shrink-0"
                  :class="{
                    'bg-blue-100 text-blue-600': item.color === 'blue',
                    'bg-green-100 text-green-600': item.color === 'green',
                    'bg-purple-100 text-purple-600': item.color === 'purple',
                    'bg-amber-100 text-amber-600': item.color === 'amber',
                  }"
                >
                  <item.icon :size="24" />
                </div>
                <span class="text-lg font-semibold text-gray-900">{{ item.label }}</span>
              </button>
            </Motion>
          </div>
        </div>
      </div>
    </div>
  </MouseGlowBackground>
</template>
