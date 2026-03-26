import type { LoginPayload, RegistroPayload, AuthResponse, Bodega, Catalogos, BodegasResponse } from '@/types'

const API_BASE = '/api'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud')
  }

  return data as T
}

export const api = {
  auth: {
    login(payload: LoginPayload): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    registro(payload: RegistroPayload): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/registro', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    perfil(): Promise<{ usuario: AuthResponse['usuario'] }> {
      return request('/auth/perfil')
    },
  },

  bodegas: {
    listar(params?: { region_id?: number; estado?: string; municipio?: string; q?: string }): Promise<BodegasResponse> {
      const qs = new URLSearchParams()
      if (params?.region_id) qs.set('region_id', String(params.region_id))
      if (params?.estado) qs.set('estado', params.estado)
      if (params?.municipio) qs.set('municipio', params.municipio)
      if (params?.q) qs.set('q', params.q)
      const query = qs.toString()
      return request(`/bodegas${query ? '?' + query : ''}`)
    },

    obtener(id: number): Promise<{ bodega: Bodega }> {
      return request(`/bodegas/${id}`)
    },

    catalogos(): Promise<Catalogos> {
      return request('/bodegas/catalogos')
    },
  },
}
