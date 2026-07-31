import { defineStore } from 'pinia'
import { ref } from 'vue'
import { spaceService, type Space, type Amenity } from '@/services/space.service'

export const useSpaceStore = defineStore('space', () => {
  const spaces = ref<Space[]>([])
  const currentSpace = ref<Space | null>(null)
  const amenities = ref<Amenity[]>([])
  const loading = ref(false)

  async function fetchSpaces(status?: string) {
    loading.value = true
    try {
      spaces.value = await spaceService.list(status)
    } finally {
      loading.value = false
    }
  }

  async function fetchSpaceById(id: number) {
    loading.value = true
    try {
      currentSpace.value = await spaceService.getById(id)
    } finally {
      loading.value = false
    }
  }

  async function fetchAmenities() {
    amenities.value = await spaceService.listAmenities()
  }

  async function createSpace(payload: Parameters<typeof spaceService.create>[0]) {
    const space = await spaceService.create(payload)
    spaces.value.push(space)
    return space
  }

  async function updateSpace(id: number, payload: Parameters<typeof spaceService.update>[1]) {
    const space = await spaceService.update(id, payload)
    const idx = spaces.value.findIndex(s => s.id === id)
    if (idx !== -1) spaces.value[idx] = space
    if (currentSpace.value?.id === id) currentSpace.value = space
    return space
  }

  async function deleteSpace(id: number) {
    await spaceService.delete(id)
    spaces.value = spaces.value.filter(s => s.id !== id)
    if (currentSpace.value?.id === id) currentSpace.value = null
  }

  return {
    spaces, currentSpace, amenities, loading,
    fetchSpaces, fetchSpaceById, fetchAmenities,
    createSpace, updateSpace, deleteSpace,
  }
})
