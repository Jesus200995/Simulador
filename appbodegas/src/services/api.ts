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

  // Handle 401 before parsing body
  if (response.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    window.location.href = '/login'
    throw new Error('No autorizado')
  }

  // Safely parse JSON — if the server returns HTML (502/504/nginx error) don't crash
  const contentType = response.headers.get('content-type') || ''
  let data: any = null

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    const text = await response.text()
    if (!response.ok) {
      throw new Error(`Error ${response.status}: respuesta inesperada del servidor`)
    }
    throw new Error(text.slice(0, 120) || 'Respuesta inválida del servidor')
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.detail || `Error ${response.status}`)
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

    states(): Promise<{ states: import('@/types').GeoState[] }> {
      return request('/auth/states')
    },

    municipalities(stateId: string): Promise<{ municipalities: import('@/types').GeoMunicipality[] }> {
      return request(`/auth/municipalities?state_id=${stateId}`)
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

  // =============================================
  // Módulo Precios de Maíz
  // =============================================
  preciosMaiz: {
    listar(params?: {
      tipo_precio?: string
      fuente?: string
      tipo_maiz?: string
      estado?: string
      municipio?: string
      fecha_inicio?: string
      fecha_fin?: string
    }): Promise<{ precios: any[] }> {
      const qs = new URLSearchParams()
      if (params?.tipo_precio) qs.set('tipo_precio', params.tipo_precio)
      if (params?.fuente) qs.set('fuente', params.fuente)
      if (params?.tipo_maiz) qs.set('tipo_maiz', params.tipo_maiz)
      if (params?.estado) qs.set('estado', params.estado)
      if (params?.municipio) qs.set('municipio', params.municipio)
      if (params?.fecha_inicio) qs.set('fecha_inicio', params.fecha_inicio)
      if (params?.fecha_fin) qs.set('fecha_fin', params.fecha_fin)
      const q = qs.toString()
      return request(`/precios${q ? '?' + q : ''}`)
    },

    registrar(payload: {
      tipo_precio: string
      fuente?: string
      tipo_maiz: string
      fecha: string
      precio: number
      estado?: string
      municipio?: string
      observaciones?: string
      valor_origen?: number
      unidad_origen?: string
      tipo_cambio?: number
      programa?: string
      bodega_id?: number
    }): Promise<{ mensaje: string; precio: any }> {
      return request('/precios', { method: 'POST', body: JSON.stringify(payload) })
    },

    dashboard(): Promise<{
      kpi: { promedio: number; maximo: number; minimo: number; total_registros: number }
      por_tipo_maiz: any[]
      ultimo_internacional: any | null
      ultimo_gobierno: any | null
    }> {
      return request('/precios/dashboard')
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

  // =============================================
  // Módulo Seguimiento de Maíz
  // =============================================
  seguimiento: {
    productores(q?: string): Promise<any> {
      return request(`/seguimiento/productores${q ? '?q=' + encodeURIComponent(q) : ''}`)
    },

    visitas(params: { up_id?: number; ciclo_id?: number; producer_id?: number }): Promise<any> {
      const qs = new URLSearchParams()
      if (params.up_id) qs.set('up_id', String(params.up_id))
      if (params.ciclo_id) qs.set('ciclo_id', String(params.ciclo_id))
      if (params.producer_id) qs.set('producer_id', String(params.producer_id))
      return request(`/seguimiento/visitas?${qs.toString()}`)
    },

    crearVisita(payload: any): Promise<any> {
      return request('/seguimiento/visitas', { method: 'POST', body: JSON.stringify(payload) })
    },

    incidencias(params: { up_id?: number; ciclo_id?: number; producer_id?: number }): Promise<any> {
      const qs = new URLSearchParams()
      if (params.up_id) qs.set('up_id', String(params.up_id))
      if (params.ciclo_id) qs.set('ciclo_id', String(params.ciclo_id))
      if (params.producer_id) qs.set('producer_id', String(params.producer_id))
      return request(`/seguimiento/incidencias?${qs.toString()}`)
    },

    crearIncidencia(payload: any): Promise<any> {
      return request('/seguimiento/incidencias', { method: 'POST', body: JSON.stringify(payload) })
    },

    estimaciones(params: { up_id?: number; ciclo_id?: number }): Promise<any> {
      const qs = new URLSearchParams()
      if (params.up_id) qs.set('up_id', String(params.up_id))
      if (params.ciclo_id) qs.set('ciclo_id', String(params.ciclo_id))
      return request(`/seguimiento/estimacion?${qs.toString()}`)
    },

    crearEstimacion(payload: any): Promise<any> {
      return request('/seguimiento/estimacion', { method: 'POST', body: JSON.stringify(payload) })
    },

    cosechas(params: { up_id?: number; ciclo_id?: number }): Promise<any> {
      const qs = new URLSearchParams()
      if (params.up_id) qs.set('up_id', String(params.up_id))
      if (params.ciclo_id) qs.set('ciclo_id', String(params.ciclo_id))
      return request(`/seguimiento/cosecha?${qs.toString()}`)
    },

    crearCosecha(payload: any): Promise<any> {
      return request('/seguimiento/cosecha', { method: 'POST', body: JSON.stringify(payload) })
    },

    resumen(producerId: number, upId: number, cicloId: number): Promise<any> {
      return request(`/seguimiento/resumen/${producerId}/${upId}/${cicloId}`)
    },
  },

  // =============================================
  // Módulo Alertas híbridas
  // =============================================
  alertas: {
    listar(params?: { up_id?: number; ciclo_id?: number; estado_alerta?: string; nivel_alerta?: string }): Promise<any> {
      const qs = new URLSearchParams()
      if (params?.up_id) qs.set('up_id', String(params.up_id))
      if (params?.ciclo_id) qs.set('ciclo_id', String(params.ciclo_id))
      if (params?.estado_alerta) qs.set('estado_alerta', params.estado_alerta)
      if (params?.nivel_alerta) qs.set('nivel_alerta', params.nivel_alerta)
      return request(`/alertas?${qs.toString()}`)
    },

    obtener(id: number): Promise<any> {
      return request(`/alertas/${id}`)
    },

    crear(payload: any): Promise<any> {
      return request('/alertas', { method: 'POST', body: JSON.stringify(payload) })
    },

    cambiarEstado(id: number, estado_alerta: string, observaciones?: string): Promise<any> {
      return request(`/alertas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado_alerta, observaciones }),
      })
    },

    editar(id: number, payload: any): Promise<any> {
      return request(`/alertas/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    },

    notificaciones(): Promise<any> {
      return request('/alertas/notificaciones/mis')
    },

    marcarLeida(id: number): Promise<any> {
      return request(`/alertas/notificaciones/${id}/leer`, { method: 'PATCH' })
    },

    marcarTodasLeidas(): Promise<any> {
      return request('/alertas/notificaciones/leer-todas', { method: 'PATCH' })
    },
  },

  // =============================================
  // Módulo Infraestructura PRO
  // =============================================
  infraestructura: {
    catalogos(): Promise<any> {
      return request('/infraestructura/catalogos')
    },

    listar(params?: { tipo?: string; estado?: string; municipio?: string; q?: string }): Promise<any> {
      const qs = new URLSearchParams()
      if (params?.tipo) qs.set('tipo', params.tipo)
      if (params?.estado) qs.set('estado', params.estado)
      if (params?.municipio) qs.set('municipio', params.municipio)
      if (params?.q) qs.set('q', params.q)
      return request(`/infraestructura?${qs.toString()}`)
    },

    obtener(id: number): Promise<any> {
      return request(`/infraestructura/${id}`)
    },

    crear(payload: any): Promise<any> {
      return request('/infraestructura', { method: 'POST', body: JSON.stringify(payload) })
    },

    editar(id: number, payload: any): Promise<any> {
      return request(`/infraestructura/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    },

    agregarContacto(id: number, payload: any): Promise<any> {
      return request(`/infraestructura/${id}/contactos`, { method: 'POST', body: JSON.stringify(payload) })
    },

    eliminarContacto(id: number, cid: number): Promise<any> {
      return request(`/infraestructura/${id}/contactos/${cid}`, { method: 'DELETE' })
    },

    registrarInventario(id: number, payload: any): Promise<any> {
      return request(`/infraestructura/${id}/inventario`, { method: 'POST', body: JSON.stringify(payload) })
    },

    precios(id: number): Promise<any> {
      return request(`/infraestructura/${id}/precios`)
    },

    registrarPrecio(id: number, payload: any): Promise<any> {
      return request(`/infraestructura/${id}/precios`, { method: 'POST', body: JSON.stringify(payload) })
    },

    aprobar(id: number): Promise<any> {
      return request(`/infraestructura/${id}/aprobar`, { method: 'PATCH' })
    },
  },
}
