import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardService, type DashboardData } from '@/services/dashboard.service'

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref('')

  async function fetchData() {
    loading.value = true
    error.value = ''
    try {
      data.value = await dashboardService.get()
    } catch {
      error.value = 'No se pudieron cargar las estadísticas'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchData }
})
