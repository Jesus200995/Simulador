<template>
  <AppShell v-if="authStore.isAuthenticated && !isGuestRoute" :full-bleed="isMapRoute">
    <router-view />
  </AppShell>
  <router-view v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppShell from '@/components/AppShell.vue'

const authStore = useAuthStore()
const route = useRoute()

const isGuestRoute = computed(() => route.meta.guest === true)
const isMapRoute = computed(() => route.name === 'Mapa')
</script>
