<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')

async function handleSubmit() {
  try {
    error.value = ''
    await auth.register(email.value, password.value, name.value)
    router.push('/profile')
  } catch {
    error.value = 'Error al registrarse'
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <h1>Crear cuenta</h1>
    <input v-model="name" placeholder="Nombre" required />
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Contraseña" required />
    <button type="submit">Registrarse</button>
    <p v-if="error">{{ error }}</p>
    <router-link to="/login">Ya tengo cuenta</router-link>
  </form>
</template>
