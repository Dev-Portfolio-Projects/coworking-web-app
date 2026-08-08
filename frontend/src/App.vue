<script setup lang="ts">
import AppNav from "@/components/AppNav.vue";
import ChatWidget from "@/components/ChatWidget.vue";
import { Toaster } from "vue-sonner";
import { onMounted } from "vue";
import { useAuthStore } from "@/stores/auth.store";
import { useRealtimeSync } from "@/composables/useRealtimeSync";
import { useBackendWake } from "@/composables/useBackendWake";
import { ROLE_CLIENT } from "@/utils/roles";

const auth = useAuthStore();

useRealtimeSync();
useBackendWake();

onMounted(async () => {
  if (auth.isAuthenticated) {
    try {
      await auth.fetchProfile();
    } catch {
      // Sesión inválida: el interceptor HTTP redirige a /login en caso de 401
    }
  }
});
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <AppNav />

    <main class="flex-1 min-h-0 overflow-hidden">
      <router-view />
    </main>
  </div>

  <ChatWidget v-if="auth.role === ROLE_CLIENT" />

  <Toaster richColors position="top-right" closeButton />
</template>
