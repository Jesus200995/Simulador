export interface Usuario {
  id: number
  email: string
  curp: string
  nombre_completo: string
  telefono: string
  rol: 'tecnico' | 'supervisor' | 'responsable' | 'admin'
  state_id?: string
  municipality_id?: string
}

export type UserRole = 'tecnico' | 'supervisor' | 'responsable' | 'admin'

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
  rol: string
  state_id: string
  municipality_id: string
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
  total_inventarios: number
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
  tipo_maiz: string
  origen: string
  volumen_almacenamiento: number
  volumen_problemas?: number
}

export interface Inventario {
  id: number
  bodega_id: number
  ciclo: string
  tipo_maiz: string
  origen: string
  volumen_almacenamiento: number
  volumen_problemas: number
  fecha_registro: string
  registrado_por: string | null
}

export interface MiInventario extends Inventario {
  bodega_nombre: string
  municipio: string
  estado: string
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

export interface AdminUsuario {
  id: number
  email: string
  curp: string
  nombre_completo: string
  telefono: string
  rol: UserRole
  activo: boolean
  fecha_registro: string
}

// =============================================
// Módulo Productor - Sembrando Vida
// =============================================

export interface Producer {
  producer_id: number
  curp: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string
  sexo: string
  telefono: string
  correo_electronico: string | null
  state_id: string
  municipality_id: string
  localidad: string
  tecnico_asignado_id: number | null
  estatus_registro: string
  observaciones: string | null
  privacy_consent: boolean
  usuario_id: number
  usuario_capturista_id: number | null
  fecha_captura: string | null
  created_at: string
  updated_at?: string
}

export interface CatalogItem {
  code: string
  label: string
}

export interface CropVariety {
  code: string
  label: string
}

export interface GeoState {
  state_id: string
  name: string
}

export interface GeoMunicipality {
  municipality_id: string
  name: string
}

export interface ProductorCatalogos {
  catalogs: Record<string, CatalogItem[]>
  varieties: Record<string, CropVariety[]>
  states: GeoState[]
}

export interface UP {
  up_id: number
  producer_id: number
  up_name: string
  up_type: string
  production_system: string
  water_regime: string
  area_ha_calc: number | null
  state_name: string | null
  municipality_name: string | null
  state_id: string | null
  municipality_id: string | null
  location_confirmed: boolean | null
  location_correction_reason: string | null
  geom_geojson: any
  centroid_lng: number | null
  centroid_lat: number | null
  curp?: string
  created_at: string
  updated_at?: string
}

export interface Cycle {
  cycle_id: number
  up_id: number
  cycle_year: number
  cycle_type: string
  created_at: string
  crops: CycleCrop[]
}

export interface CycleCrop {
  cycle_crop_id: number
  crop: string
  variety_id: string
  variety_other: string | null
  area_sown_ha: number
  planting_date: string
  estimated_harvest_date: string | null
  yield_expected: number | null
  area_harvested_ha: number | null
  destination: string | null
  production_qty: number | null
  production_unit: string | null
}

export interface CreateUPPayload {
  curp: string
  up_name: string
  up_type: string
  production_system: string
  water_regime: string
  geom_geojson: any
  state_name?: string
  municipality_name?: string
}

export interface CreateCyclePayload {
  cycle_year: number
  cycle_type: string
}

export interface CreateCycleCropPayload {
  crop: string
  variety_id: string
  variety_other?: string
  area_sown_ha: number
  planting_date: string
  estimated_harvest_date?: string
  yield_expected?: number
  area_harvested_ha?: number
  destination?: string
  production_qty?: number
  production_unit?: string
}
