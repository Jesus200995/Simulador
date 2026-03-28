import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { Usuario, LoginPayload, RegistroPayload, UserRole } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const usuario = ref<Usuario | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const rol = computed<UserRole>(() => usuario.value?.rol || 'general')
  const isGeneral = computed(() => rol.value === 'general')
  const isBodeguero = computed(() => rol.value === 'bodeguero')
  const isAdmin = computed(() => rol.value === 'admin')
  const canCapture = computed(() => rol.value === 'bodeguero' || rol.value === 'admin')

  // Restaurar usuario desde localStorage
  const stored = localStorage.getItem('usuario')
  if (stored) {
    try {
      usuario.value = JSON.parse(stored)
    } catch {
      localStorage.removeItem('usuario')
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await api.auth.login(payload)
      token.value = res.token
      usuario.value = res.usuario
      localStorage.setItem('token', res.token)
      localStorage.setItem('usuario', JSON.stringify(res.usuario))
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function registro(payload: RegistroPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await api.auth.registro(payload)
      token.value = res.token
      usuario.value = res.usuario
      localStorage.setItem('token', res.token)
      localStorage.setItem('usuario', JSON.stringify(res.usuario))
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    usuario.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  function clearError() {
    error.value = null
  }

  return { token, usuario, loading, error, isAuthenticated, rol, isGeneral, isBodeguero, isAdmin, canCapture, login, registro, logout, clearError }
})
