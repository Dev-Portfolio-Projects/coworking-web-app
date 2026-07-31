import { defineStore } from 'pinia'
import { ref } from 'vue'
import { amenityService, type AdminAmenity } from '@/services/amenity.service'

export const useAmenityStore = defineStore('amenity', () => {
  const amenities = ref<AdminAmenity[]>([])
  const loading = ref(false)

  async function fetchAmenities() {
    loading.value = true
    try {
      amenities.value = await amenityService.list()
    } finally {
      loading.value = false
    }
  }

  async function createAmenity(payload: { name: string; description?: string }) {
    const amenity = await amenityService.create(payload)
    amenities.value.push(amenity)
    return amenity
  }

  async function updateAmenity(id: number, payload: { name?: string; description?: string }) {
    const amenity = await amenityService.update(id, payload)
    const idx = amenities.value.findIndex(a => a.id === id)
    if (idx !== -1) amenities.value[idx] = amenity
    return amenity
  }

  async function deleteAmenity(id: number) {
    await amenityService.delete(id)
    amenities.value = amenities.value.filter(a => a.id !== id)
  }

  return { amenities, loading, fetchAmenities, createAmenity, updateAmenity, deleteAmenity }
})
