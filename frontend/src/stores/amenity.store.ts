import { defineStore } from 'pinia'
import { ref } from 'vue'
import { amenityService, type AdminAmenity } from '@/services/amenity.service'

export const useAmenityStore = defineStore('amenity', () => {
  const amenities = ref<AdminAmenity[]>([])
  const loading = ref(false)
  const page = ref(1)
  const limit = ref(12)
  const total = ref(0)
  const totalPages = ref(0)
  const search = ref('')

  async function fetchAmenities(params: {
    search?: string
    page?: number
    limit?: number
  } = {}) {
    loading.value = true
    try {
      const res = await amenityService.list(params)
      amenities.value = res.items
      total.value = res.meta.total
      totalPages.value = res.meta.totalPages
      page.value = res.meta.page
      limit.value = res.meta.limit
      if (params.search !== undefined) search.value = params.search
    } finally {
      loading.value = false
    }
  }

  async function reload() {
    await fetchAmenities({ search: search.value, page: page.value, limit: limit.value })
  }

  async function createAmenity(payload: { name: string; description?: string }) {
    const amenity = await amenityService.create(payload)
    await reload()
    return amenity
  }

  async function updateAmenity(id: number, payload: { name?: string; description?: string }) {
    const amenity = await amenityService.update(id, payload)
    await reload()
    return amenity
  }

  async function deleteAmenity(id: number) {
    await amenityService.delete(id)
    const lastPage = Math.max(1, Math.ceil((total.value - 1) / (limit.value || 1)))
    if (page.value > lastPage) page.value = lastPage
    await reload()
  }

  return {
    amenities, loading, page, limit, total, totalPages, search,
    fetchAmenities, reload, createAmenity, updateAmenity, deleteAmenity,
  }
})
