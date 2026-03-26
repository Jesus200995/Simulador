export interface Usuario {
  id: number
  email: string
  curp: string
  nombre_completo: string
  telefono: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegistroPayload {
  email: string
  curp: string
  nombre_completo: string
  password: string
  telefono: string
}

export interface AuthResponse {
  message: string
  token: string
  usuario: Usuario
}

export interface Bodega {
  id: number
  nombre: string
  clave: string | null
  descripcion: string | null
  latitud: number
  longitud: number
  direccion: string | null
  capacidad_m2: number | null
  estado: string | null
  municipio: string | null
  region_id: number | null
  region_nombre: string | null
  toneladas_total: number
  toneladas_nacional: number
  toneladas_importacion: number
  fecha_actualizacion: string | null
}

export interface Region {
  id: number
  nombre: string
}

export interface CatalogoEstado {
  estado: string
  region_id: number
}

export interface CatalogoMunicipio {
  municipio: string
  estado: string
}

export interface Catalogos {
  regiones: Region[]
  estados: CatalogoEstado[]
  municipios: CatalogoMunicipio[]
}

export interface KpiAgregado {
  total_bodegas: number
  total_toneladas: number
  total_nacional: number
  total_importacion: number
}

export interface BodegasResponse {
  bodegas: Bodega[]
  kpi: KpiAgregado
}
