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
  descripcion: string | null
  latitud: number
  longitud: number
  direccion: string | null
  capacidad_m2: number | null
  estado: string
  created_at: string
  updated_at: string
}
