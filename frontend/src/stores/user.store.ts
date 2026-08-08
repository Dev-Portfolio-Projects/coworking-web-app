import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userService, type User } from '@/services/user.service'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const page = ref(1)
  const limit = ref(12)
  const total = ref(0)
  const totalPages = ref(0)
  const search = ref('')
  const roleId = ref<number | null>(null)

  async function fetchUsers(params: {
    search?: string
    roleId?: number
    page?: number
    limit?: number
  } = {}) {
    loading.value = true
    try {
      const res = await userService.list(params)
      users.value = res.items
      total.value = res.meta.total
      totalPages.value = res.meta.totalPages
      page.value = res.meta.page
      limit.value = res.meta.limit
      if (params.search !== undefined) search.value = params.search
      if (params.roleId !== undefined) roleId.value = params.roleId
    } finally {
      loading.value = false
    }
  }

  async function reload() {
    await fetchUsers({ search: search.value, roleId: roleId.value ?? undefined, page: page.value, limit: limit.value })
  }

  async function createUser(payload: Parameters<typeof userService.create>[0]) {
    const user = await userService.create(payload)
    await reload()
    return user
  }

  async function updateUser(id: number, payload: Parameters<typeof userService.update>[1]) {
    const user = await userService.update(id, payload)
    await reload()
    return user
  }

  async function deleteUser(id: number) {
    await userService.delete(id)
    const lastPage = Math.max(1, Math.ceil((total.value - 1) / (limit.value || 1)))
    if (page.value > lastPage) page.value = lastPage
    await reload()
  }

  return {
    users, loading, page, limit, total, totalPages, search, roleId,
    fetchUsers, reload, createUser, updateUser, deleteUser,
  }
})
