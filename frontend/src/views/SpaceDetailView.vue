<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSpaceStore } from '@/stores/space.store'
import { Motion } from 'motion-v'
import { ArrowLeft, Users, DollarSign, DoorOpen, CheckCircle2, XCircle } from '@lucide/vue'
import MouseGlowBackground from '@/components/MouseGlowBackground.vue'

const route = useRoute()
const router = useRouter()
const spaceStore = useSpaceStore()
const id = Number(route.params.id)

onMounted(async () => {
  await spaceStore.fetchSpaceById(id)
})
</script>

<template>
  <MouseGlowBackground>
    <div class="relative h-full overflow-y-auto">
      <section class="relative z-10 mx-auto max-w-4xl px-6 py-8">
        <Motion
          :initial="{ opacity: 0, x: -10 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="{ duration: 0.3 }"
        >
          <button
            class="mb-6 flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
            @click="router.push('/catalog')"
          >
            <ArrowLeft :size="17" />
            Volver al catálogo
          </button>
        </Motion>

        <Motion
          v-if="spaceStore.loading"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          class="flex justify-center pt-16"
        >
          <Motion
            :animate="{ rotate: 360 }"
            :transition="{ duration: 1.2, repeat: Infinity, ease: 'linear' }"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <DoorOpen :size="24" />
            </div>
          </Motion>
        </Motion>

        <Motion
          v-else-if="!spaceStore.currentSpace"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          class="pt-16 text-center"
        >
          <p class="text-gray-500">Espacio no encontrado.</p>
        </Motion>

        <Motion
          v-else
          :initial="{ opacity: 0, y: 15 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
        >
          <div class="rounded-3xl border border-gray-200 bg-white/80 p-8 backdrop-blur-xl">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold tracking-tight text-gray-900">{{ spaceStore.currentSpace.name }}</h1>
                <div class="mt-2 flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    :class="spaceStore.currentSpace.status === 'AVAILABLE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'"
                  >
                    <component
                      :is="spaceStore.currentSpace.status === 'AVAILABLE' ? CheckCircle2 : XCircle"
                      :size="13"
                    />
                    {{ spaceStore.currentSpace.status === 'AVAILABLE' ? 'Disponible' : 'No disponible' }}
                  </span>
                </div>
              </div>
            </div>

            <p class="mt-6 leading-relaxed text-gray-600">{{ spaceStore.currentSpace.description }}</p>

            <div class="mt-6 flex flex-wrap gap-6">
              <div class="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
                <Users :size="18" class="text-gray-400" />
                <div>
                  <p class="text-xs text-gray-500">Capacidad</p>
                  <p class="text-sm font-medium text-gray-900">{{ spaceStore.currentSpace.capacity }} personas</p>
                </div>
              </div>
              <div class="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
                <DollarSign :size="18" class="text-gray-400" />
                <div>
                  <p class="text-xs text-gray-500">Precio</p>
                  <p class="text-sm font-medium text-gray-900">${{ spaceStore.currentSpace.priceHour }}/hora</p>
                </div>
              </div>
            </div>

            <div v-if="spaceStore.currentSpace.amenities?.length" class="mt-8">
              <h3 class="text-sm font-semibold text-gray-900">Recursos incluidos</h3>
              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="a in spaceStore.currentSpace.amenities"
                  :key="a.id"
                  class="rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                >
                  {{ a.name }}
                </span>
              </div>
            </div>

            <div v-if="spaceStore.currentSpace.images?.length" class="mt-8">
              <h3 class="text-sm font-semibold text-gray-900">Galería</h3>
              <div class="mt-3 flex gap-3 overflow-x-auto pb-2">
                <img
                  v-for="(img, i) in spaceStore.currentSpace.images"
                  :key="i"
                  :src="img"
                  :alt="`Imagen ${i + 1}`"
                  class="h-48 rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </Motion>
      </section>
    </div>
  </MouseGlowBackground>
</template>
