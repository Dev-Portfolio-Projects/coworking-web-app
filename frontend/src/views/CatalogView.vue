<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpaceStore } from '@/stores/space.store'
import { Motion } from 'motion-v'
import { Users, DollarSign, DoorOpen } from '@lucide/vue'
import MouseGlowBackground from '@/components/MouseGlowBackground.vue'

const router = useRouter()
const spaceStore = useSpaceStore()

onMounted(() => {
  spaceStore.fetchSpaces('AVAILABLE')
})

function goToDetail(id: number) {
  router.push(`/spaces/${id}`)
}
</script>

<template>
  <MouseGlowBackground>
    <div class="relative h-full overflow-y-auto">
      <section class="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <Motion
          :initial="{ opacity: 0, y: -15 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
        >
          <h1 class="text-3xl font-bold tracking-tight text-gray-900">Espacios disponibles</h1>
          <p class="mt-2 text-gray-500">Encuentra el espacio perfecto para trabajar</p>
        </Motion>

        <div v-if="spaceStore.loading" class="mt-16 flex justify-center">
          <Motion
            :animate="{ rotate: 360 }"
            :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <DoorOpen :size="24" />
            </div>
          </Motion>
        </div>

        <div v-else-if="spaceStore.spaces.length === 0" class="mt-16 text-center">
          <p class="text-gray-500">No hay espacios disponibles en este momento.</p>
        </div>

        <div v-else class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Motion
            v-for="(space, index) in spaceStore.spaces"
            :key="space.id"
            :initial="{ opacity: 0, y: 20 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: index * 0.08, duration: 0.4 }"
          >
            <article
              class="cursor-pointer rounded-2xl border border-gray-200 bg-white/80 p-6 backdrop-blur-xl transition hover:shadow-lg"
              @click="goToDetail(space.id)"
            >
              <h2 class="text-lg font-semibold text-gray-900">{{ space.name }}</h2>
              <p class="mt-2 line-clamp-2 text-sm text-gray-500">{{ space.description }}</p>

              <div class="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                <span class="flex items-center gap-1">
                  <Users :size="15" class="text-gray-400" />
                  {{ space.capacity }} personas
                </span>
                <span class="flex items-center gap-1">
                  <DollarSign :size="15" class="text-gray-400" />
                  {{ space.priceHour }}/h
                </span>
              </div>

              <div v-if="space.amenities?.length" class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="a in space.amenities"
                  :key="a.id"
                  class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                >
                  {{ a.name }}
                </span>
              </div>
            </article>
          </Motion>
        </div>
      </section>
    </div>
  </MouseGlowBackground>
</template>
