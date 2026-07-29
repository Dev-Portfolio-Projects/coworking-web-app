<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

onMounted(async () => {
  if (!auth.isAuthenticated) {
    router.push('/login')
    return
  }
  try {
    await auth.fetchProfile()
  } catch {
    router.push('/login')
  }
})

function logout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <div>
    <h1>Mi perfil</h1>
    <p v-if="auth.user">Bienvenido, {{ auth.user.name }}</p>
    <p v-if="auth.user">Email: {{ auth.user.email }}</p>
    <button @click="logout">Cerrar sesión</button>
  </div>
</template>
