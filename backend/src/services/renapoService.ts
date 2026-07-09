import axios from 'axios';

const RENAPO_URL     = process.env.RENAPO_API_URL
                    || 'https://www.suri.agricultura.gob.mx:8009/renapo/getData-protegido';
const RENAPO_API_KEY = process.env.RENAPO_API_KEY || '';
const RENAPO_SESSION = process.env.RENAPO_SESSION || '';

export interface RenapoResult {
  encontrado:   boolean;
  datos?: {
    curp:         string;
    nombres:      string;
    apellidoPat:  string;
    apellidoMat:  string;
    sexo:         string;
    fechaNac:     string;
    entidadNac:   string;
    claveEntidad: string;
    historica:    boolean;
  };
  error?:  string;
  codigo?: string;
}

export const consultarCURPEnRENAPO = async (curp: string): Promise<RenapoResult> => {
  if (!RENAPO_API_KEY) {
    console.error('[RENAPO] RENAPO_API_KEY no configurada en .env');
    return { encontrado: false, error: 'Servicio no configurado', codigo: 'SIN_CONFIG' };
  }

  if (!RENAPO_SESSION) {
    console.error('[RENAPO] RENAPO_SESSION no configurada en .env — puede estar expirada');
    return { encontrado: false, error: 'Sesión RENAPO no disponible', codigo: 'SIN_SESSION' };
  }

  try {
    const response = await axios.post(
      `${RENAPO_URL}?curp=${encodeURIComponent(curp)}`,
      {},
      {
        headers: {
          'X-API-KEY':    RENAPO_API_KEY,
          'Cookie':       `suri_session=${RENAPO_SESSION}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data;

    if (!data.success || !data.values) {
      return { encontrado: false, error: 'CURP no encontrada', codigo: 'NO_ENCONTRADA' };
    }

    return {
      encontrado: true,
      datos: {
        curp:         data.values.curp,
        nombres:      data.values.nombre,
        apellidoPat:  data.values.appat,
        apellidoMat:  data.values.apmat,
        sexo:         data.values.sexo,
        fechaNac:     data.values.fechaNac,
        entidadNac:   data.values.entidadNac,
        claveEntidad: data.values.claveEntidad,
        historica:    data.values.historica,
      }
    };

  } catch (error: any) {
    if (error.response?.status === 407) {
      return { encontrado: false, error: 'CURP no encontrada en RENAPO', codigo: 'NO_EN_RENAPO' };
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('[RENAPO] ⚠️  SESIÓN EXPIRADA — renovar RENAPO_SESSION en .env del servidor');
      return { encontrado: false, error: 'Sesión RENAPO expirada', codigo: 'SESSION_EXPIRADA' };
    }
    if (error.response?.status === 429) {
      console.error('[RENAPO] Rate limit alcanzado');
      return { encontrado: false, error: 'Límite de consultas alcanzado', codigo: 'RATE_LIMIT' };
    }
    console.error('[RENAPO] Error de conexión:', error.message);
    return { encontrado: false, error: 'Servicio RENAPO no disponible', codigo: 'NO_DISPONIBLE' };
  }
};
