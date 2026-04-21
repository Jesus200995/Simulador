import type {
  LoginPayload, RegistroPayload, AuthResponse, Bodega, Catalogos,
  BodegasResponse, NuevaBodegaPayload, InventarioPayload, Inventario,
  PreciosResponse, MiBodega, MiInventario, AdminUsuario, UserRole,
  Producer, ProductorCatalogos, UP, Cycle, CycleCrop,
  CreateUPPayload, CreateCyclePayload, CreateCycleCropPayload,
  GeoMunicipality,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    throw new Error(data.error || data.detail || 'Error en la solicitud')
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
    listar(params?: { region_id?: number; estado?: string; municipio?: string; ddr?: string; q?: string }): Promise<BodegasResponse> {
      const qs = new URLSearchParams()
      if (params?.region_id) qs.set('region_id', String(params.region_id))
      if (params?.estado) qs.set('estado', params.estado)
      if (params?.municipio) qs.set('municipio', params.municipio)
      if (params?.ddr) qs.set('ddr', params.ddr)
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

    crear(payload: NuevaBodegaPayload): Promise<{ message: string; bodega: Bodega }> {
      return request('/bodegas', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    aprobar(id: number): Promise<{ message: string; bodega: Bodega }> {
      return request(`/bodegas/${id}/aprobar`, { method: 'PATCH' })
    },

    rechazar(id: number): Promise<{ message: string; bodega: Bodega }> {
      return request(`/bodegas/${id}/rechazar`, { method: 'PATCH' })
    },
  },

  inventarios: {
    registrar(bodegaId: number, payload: InventarioPayload): Promise<{ message: string; inventario: Inventario }> {
      return request(`/bodegas/${bodegaId}/inventario`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    listar(bodegaId: number): Promise<{ inventarios: Inventario[] }> {
      return request(`/bodegas/${bodegaId}/inventarios`)
    },
  },

  misBodegas: {
    listar(): Promise<{ bodegas: MiBodega[] }> {
      return request('/mis-bodegas')
    },
  },

  misInventarios: {
    listar(): Promise<{ inventarios: MiInventario[] }> {
      return request('/mis-inventarios')
    },
  },

  precios: {
    obtener(): Promise<PreciosResponse> {
      return request('/precios-maiz')
    },
  },

  admin: {
    listarUsuarios(): Promise<{ usuarios: AdminUsuario[] }> {
      return request('/admin/usuarios')
    },

    cambiarRol(id: number, rol: UserRole): Promise<{ message: string; usuario: AdminUsuario }> {
      return request(`/admin/usuarios/${id}/rol`, {
        method: 'PATCH',
        body: JSON.stringify({ rol }),
      })
    },

    cambiarEstatus(id: number, activo: boolean): Promise<{ message: string; usuario: AdminUsuario }> {
      return request(`/admin/usuarios/${id}/estatus`, {
        method: 'PATCH',
        body: JSON.stringify({ activo }),
      })
    },

    bodegasPendientes(): Promise<{ bodegas: Bodega[] }> {
      return request('/admin/bodegas-pendientes')
    },

    aprobarBodega(id: number): Promise<{ message: string; bodega: Bodega }> {
      return request(`/bodegas/${id}/aprobar`, { method: 'PATCH' })
    },

    rechazarBodega(id: number): Promise<{ message: string; bodega: Bodega }> {
      return request(`/bodegas/${id}/rechazar`, { method: 'PATCH' })
    },
  },

  // =============================================
  // Módulo Productor
  // =============================================
  producers: {
    crear(payload: { curp: string; phone?: string; privacy_consent: boolean }): Promise<{ producer: Producer; message: string }> {
      return request('/producers', { method: 'POST', body: JSON.stringify(payload) })
    },

    obtener(curp: string): Promise<{ producer: Producer }> {
      return request(`/producers/${curp}`)
    },
  },

  productor: {
    registrar(payload: {
      nombres: string
      apellido_paterno: string
      apellido_materno: string
      curp: string
      sexo: string
      telefono: string
      correo_electronico: string | null
      state_id: string
      municipality_id: string
      localidad: string
      observaciones: string | null
      consentimiento_recabado: boolean
    }): Promise<{ message: string; producer: Producer }> {
      return request('/producers', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },

    catalogos(): Promise<ProductorCatalogos> {
      return request('/catalogos-productor')
    },

    municipios(stateId: string): Promise<{ municipalities: GeoMunicipality[] }> {
      return request(`/catalogos-productor/municipalities?state_id=${stateId}`)
    },
  },

  catalogosProductor: {
    obtener(): Promise<ProductorCatalogos> {
      return request('/catalogos-productor')
    },

    municipios(stateId: string): Promise<{ municipalities: GeoMunicipality[] }> {
      return request(`/catalogos-productor/municipalities?state_id=${stateId}`)
    },
  },

  ups: {
    crear(payload: CreateUPPayload): Promise<{ up: UP; message: string }> {
      return request('/ups', { method: 'POST', body: JSON.stringify(payload) })
    },

    listar(curp: string): Promise<{ ups: UP[] }> {
      return request(`/ups?curp=${curp}`)
    },

    obtener(upId: number): Promise<{ up: UP }> {
      return request(`/ups/${upId}`)
    },

    actualizar(upId: number, payload: Partial<UP>): Promise<{ up: UP; message: string }> {
      return request(`/ups/${upId}`, { method: 'PATCH', body: JSON.stringify(payload) })
    },
  },

  cycles: {
    crear(upId: number, payload: CreateCyclePayload): Promise<{ cycle: Cycle; message: string }> {
      return request(`/ups/${upId}/cycles`, { method: 'POST', body: JSON.stringify(payload) })
    },

    listar(upId: number): Promise<{ cycles: Cycle[] }> {
      return request(`/ups/${upId}/cycles`)
    },

    agregarCultivo(cycleId: number, payload: CreateCycleCropPayload): Promise<{ crop: CycleCrop; message: string }> {
      return request(`/cycles/${cycleId}/crops`, { method: 'POST', body: JSON.stringify(payload) })
    },

    editarCultivo(cropId: number, payload: Partial<CreateCycleCropPayload>): Promise<{ crop: CycleCrop; message: string }> {
      return request(`/cycle-crops/${cropId}`, { method: 'PATCH', body: JSON.stringify(payload) })
    },
  },
}
