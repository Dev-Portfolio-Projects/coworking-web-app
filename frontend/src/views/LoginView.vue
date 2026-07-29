<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')

async function handleSubmit() {
  try {
    error.value = ''
    await auth.login(email.value, password.value)
    router.push('/profile')
  } catch {
    error.value = 'Credenciales inválidas'
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <h1>Iniciar sesión</h1>
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Contraseña" required />
    <button type="submit">Ingresar</button>
    <p v-if="error">{{ error }}</p>
    <router-link to="/register">Crear cuenta</router-link>
  </form>
</template>
