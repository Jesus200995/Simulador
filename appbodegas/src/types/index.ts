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
  latitud: number
  longitud: number
  estado: string | null
  municipio: string | null
  region_id: number | null
  region_nombre: string | null
  ddr: string | null
  cader: string | null
  ejido: string | null
  direccion: string | null
  localidad: string | null
  codigo_postal: string | null
  capacidad_toneladas: number
  cvegeo: string | null
  cve_ent: string | null
  cve_mun: string | null
  fecha_actualizacion: string | null
}

export interface Region {
  id: number
  nombre: string
  estado: string | null
}

export interface CatalogoEstado {
  estado: string
}

export interface CatalogoMunicipio {
  municipio: string
  estado: string
}

export interface CatalogoDdr {
  ddr: string
  estado: string
}

export interface Catalogos {
  regiones: Region[]
  estados: CatalogoEstado[]
  municipios: CatalogoMunicipio[]
  ddrs: CatalogoDdr[]
}

export interface KpiAgregado {
  total_bodegas: number
  total_capacidad: number
  total_estados: number
  total_municipios: number
}

export interface BodegasResponse {
  bodegas: Bodega[]
  kpi: KpiAgregado
}
