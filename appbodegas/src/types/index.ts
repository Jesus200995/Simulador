export interface Usuario {
  id: number
  email: string
  curp: string
  nombre_completo: string
  telefono: string
  rol?: string
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
  estatus: string
  creado_por: number | null
  aprobado_por: number | null
  fecha_aprobacion: string | null
  fecha_creacion: string | null
}

export interface Region {
  id: number
  nombre: string
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

export interface NuevaBodegaPayload {
  clave: string
  nombre: string
  estado: string
  municipio: string
  ddr?: string
  cader?: string
  ejido?: string
  direccion?: string
  localidad?: string
  codigo_postal?: string
  capacidad_toneladas?: number
  latitud: number
  longitud: number
}

export interface InventarioPayload {
  ciclo: string
  volumen_almacenamiento: number
  volumen_problemas?: number
}

export interface Inventario {
  id: number
  bodega_id: number
  ciclo: string
  volumen_almacenamiento: number
  volumen_problemas: number
  fecha_registro: string
  registrado_por: string | null
}

export interface PrecioMaiz {
  id: number
  tipo: string
  precio: number
  unidad: string
  tendencia: string
  fecha_actualizacion: string
}

export interface PreciosResponse {
  precios: PrecioMaiz[]
  promedio: number
  tendencia_general: string
}

export interface MiBodega extends Bodega {
  total_inventarios: number
  ultimo_inventario: string | null
}
