<script setup lang="ts">
import AppNav from "@/components/AppNav.vue";
import { Toaster } from "vue-sonner";
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden">
    <AppNav />

    <main class="flex-1 min-h-0 overflow-hidden">
      <router-view />
    </main>
  </div>

  <Toaster richColors position="top-right" closeButton />
</template>
