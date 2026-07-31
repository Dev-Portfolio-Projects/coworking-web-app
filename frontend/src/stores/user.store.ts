import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userService, type User } from '@/services/user.service'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)

  async function fetchUsers() {
    loading.value = true
    try {
      users.value = await userService.list()
    } finally {
      loading.value = false
    }
  }

  async function createUser(payload: Parameters<typeof userService.create>[0]) {
    const user = await userService.create(payload)
    users.value.push(user)
    return user
  }

  async function updateUser(id: number, payload: Parameters<typeof userService.update>[1]) {
    const user = await userService.update(id, payload)
    const idx = users.value.findIndex(u => u.id === id)
    if (idx !== -1) users.value[idx] = user
    return user
  }

  async function deleteUser(id: number) {
    await userService.delete(id)
    users.value = users.value.filter(u => u.id !== id)
  }

  return { users, loading, fetchUsers, createUser, updateUser, deleteUser }
})
