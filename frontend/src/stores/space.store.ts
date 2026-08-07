import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  spaceService,
  type Space,
  type Amenity,
  type SpaceListParams,
  type AvailabilitySlot,
  type AvailabilitySlotPayload,
} from '@/services/space.service'

const AVAILABILITY_TTL_MS = 60_000

export const useSpaceStore = defineStore('space', () => {
  const spaces = ref<Space[]>([])
  const currentSpace = ref<Space | null>(null)
  const amenities = ref<Amenity[]>([])
  const availability = ref<AvailabilitySlot[]>([])
  const loading = ref(false)
  const availabilityLoading = ref(false)
  const page = ref(1)
  const limit = ref(12)
  const total = ref(0)
  const totalPages = ref(0)
  const filters = ref<SpaceListParams>({})

  const spaceCache = ref<Map<number, Space>>(new Map())
  const availabilityCache = ref<Map<number, { slots: AvailabilitySlot[]; fetchedAt: number }>>(new Map())

  function cacheSpace(space: Space) {
    spaceCache.value.set(space.id, space)
  }

  function getCachedSpace(id: number): Space | null {
    return spaceCache.value.get(id) ?? null
  }

  async function ensureSpace(id: number): Promise<Space | null> {
    const cached = getCachedSpace(id)
    if (cached) return cached
    try {
      const space = await spaceService.getById(id)
      cacheSpace(space)
      return space
    } catch {
      return null
    }
  }

  function getCachedAvailability(spaceId: number): AvailabilitySlot[] | null {
    return availabilityCache.value.get(spaceId)?.slots ?? null
  }

  async function fetchAvailabilityCached(spaceId: number, force = false): Promise<AvailabilitySlot[]> {
    const entry = availabilityCache.value.get(spaceId)
    if (!force && entry && Date.now() - entry.fetchedAt < AVAILABILITY_TTL_MS) {
      return entry.slots
    }
    const res = await spaceService.getAvailability(spaceId)
    availabilityCache.value.set(spaceId, { slots: res.slots, fetchedAt: Date.now() })
    return res.slots
  }

  function invalidateAvailability(spaceId: number) {
    availabilityCache.value.delete(spaceId)
  }

  async function fetchSpaces(params: SpaceListParams = {}) {
    loading.value = true
    try {
      const res = await spaceService.list(params)
      spaces.value = res.items
      total.value = res.meta.total
      totalPages.value = res.meta.totalPages
      page.value = res.meta.page
      limit.value = res.meta.limit
      filters.value = { ...params }
      for (const s of res.items) cacheSpace(s)
    } finally {
      loading.value = false
    }
  }

  async function refreshSpaces(params?: SpaceListParams) {
    const query = params ?? { ...filters.value, page: page.value, limit: limit.value }
    try {
      const res = await spaceService.list(query)
      spaces.value = res.items
      total.value = res.meta.total
      totalPages.value = res.meta.totalPages
      page.value = res.meta.page
      limit.value = res.meta.limit
      if (params) filters.value = { ...params }
      for (const s of res.items) cacheSpace(s)
    } catch {
      // mantener los datos previos
    }
  }

  async function reload() {
    await fetchSpaces({ ...filters.value, page: page.value, limit: limit.value })
  }

  async function fetchSpaceById(id: number) {
    loading.value = true
    try {
      currentSpace.value = await spaceService.getById(id)
      if (currentSpace.value) cacheSpace(currentSpace.value)
    } finally {
      loading.value = false
    }
  }

  async function fetchAmenities() {
    amenities.value = await spaceService.listAmenities()
  }

  async function refreshAmenities() {
    try {
      amenities.value = await spaceService.listAmenities()
    } catch {
      // mantener los datos previos
    }
  }

  async function createSpace(payload: Parameters<typeof spaceService.create>[0]) {
    const space = await spaceService.create(payload)
    cacheSpace(space)
    await reload()
    return space
  }

  async function updateSpace(id: number, payload: Parameters<typeof spaceService.update>[1]) {
    const space = await spaceService.update(id, payload)
    if (currentSpace.value?.id === id) currentSpace.value = space
    cacheSpace(space)
    await reload()
    return space
  }

  async function deleteSpace(id: number) {
    await spaceService.delete(id)
    if (currentSpace.value?.id === id) currentSpace.value = null
    spaceCache.value.delete(id)
    availabilityCache.value.delete(id)
    const lastPage = Math.max(1, Math.ceil((total.value - 1) / (limit.value || 1)))
    if (page.value > lastPage) page.value = lastPage
    await reload()
  }

  async function fetchAvailability(spaceId: number) {
    availabilityLoading.value = true
    try {
      const res = await spaceService.getAdminAvailability(spaceId)
      availability.value = res.slots
      return res.slots
    } finally {
      availabilityLoading.value = false
    }
  }

  async function saveAvailability(spaceId: number, slots: AvailabilitySlotPayload[]) {
    const res = await spaceService.setAvailability(spaceId, slots)
    availability.value = res.slots
    availabilityCache.value.delete(spaceId)
    return res.slots
  }

  return {
    spaces, currentSpace, amenities, availability, loading, availabilityLoading,
    page, limit, total, totalPages, filters,
    getCachedSpace, ensureSpace, getCachedAvailability, fetchAvailabilityCached, invalidateAvailability,
    fetchSpaces, refreshSpaces, fetchSpaceById, fetchAmenities, refreshAmenities, reload,
    createSpace, updateSpace, deleteSpace,
    fetchAvailability, saveAvailability,
  }
})
