export interface Usuario {
  id: number;
  email: string;
  curp: string;
  nombre_completo: string;
  password_hash: string;
  telefono: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RegistroPayload {
  email: string;
  curp: string;
  nombre_completo: string;
  password: string;
  telefono: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface Bodega {
  id: number;
  nombre: string;
  descripcion: string | null;
  latitud: number;
  longitud: number;
  direccion: string | null;
  capacidad_m2: number | null;
  estado: string;
  usuario_id: number | null;
  created_at: Date;
  updated_at: Date;
}
