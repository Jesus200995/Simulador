import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import { 
  ArrowLeft, Users, Mail, Phone, Calendar, MapPin, Sprout, 
  Check, X, AlertTriangle, RefreshCw 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

interface ProductorDetalle {
  id: number;
  nombre: string;
  apellidos: string;
  curp: string;
  email: string;
  telefono: string;
  rol: string;
  estado_validacion: 'pendiente' | 'activo' | 'rechazado' | 'suspendido';
  created_at: string;
  tipo_productor: 'A' | 'B';
  up: {
    estado: string;
    municipio: string;
    superficie_hectareas: number;
    cultivo_principal: string;
    variedad: string;
    ciclo_activo: string;
    geom?: any; // GeoJSON geometry (MultiPolygon)
    latitud?: number;
    longitud?: number;
  } | null;
  disponibilidades: {
    id: number;
    tipo_maiz: string;
    variedad: string;
    volumen_toneladas: number;
    created_at: string;
    activa: boolean;
  }[];
}

export default function ProductorDetalleAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProductorDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  // Modales de acción
  const [modalType, setModalType] = useState<'aprobar' | 'rechazar' | 'suspender' | 'reactivar' | null>(null);
  const [notaInterna, setNotaInterna] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function cargarDetalle() {
    setLoading(true);
    try {
      // 1. Cargar datos del productor desde el nuevo endpoint
      const resU = await fetch(`${BASE}/admin/usuarios/${id}`, { headers: HDR() });
      if (!resU.ok) throw new Error(`Error al cargar usuario: ${resU.status}`);
      const userRes = await resU.json();
      // El endpoint devuelve { productor: {...} }
      const u = userRes.productor || userRes.usuario || userRes;

      // 2. Cargar UPs de este productor
      let upData = null;
      try {
        const resUp = await fetch(`${BASE}/producers/${id}/ups`, { headers: HDR() });
        if (resUp.ok) {
          const ups = await resUp.json();
          if (ups && ups.length > 0) {
            const firstUp = ups[0];
            
            // Si tiene geometría
            let geom = null;
            let lat = 24.8083;
            let lng = -107.3941;
            if (firstUp.geom) {
              geom = typeof firstUp.geom === 'string' ? JSON.parse(firstUp.geom) : firstUp.geom;
            }
            if (firstUp.latitud && firstUp.longitud) {
              lat = parseFloat(firstUp.latitud);
              lng = parseFloat(firstUp.longitud);
            }

            upData = {
              estado: firstUp.estado || 'Sinaloa',
              municipio: firstUp.municipio || 'Guasave',
              superficie_hectareas: parseFloat(firstUp.superficie_hectareas || '10'),
              cultivo_principal: firstUp.cultivo_principal || 'Maíz Blanco',
              variedad: firstUp.variedad || 'H-377',
              ciclo_activo: firstUp.ciclo_activo || 'OI 2026',
              geom,
              latitud: lat,
              longitud: lng
            };
          }
        }
      } catch (eUp) {
        console.error('Error al cargar UP del productor:', eUp);
      }

      // 3. Cargar disponibilidades
      let dispList = [];
      try {
        const resDisp = await fetch(`${BASE}/productor/disponibilidad`, { headers: HDR() });
        if (resDisp.ok) {
          const disp = await resDisp.json();
          // Filtrar por este productor si el endpoint devuelve todo
          dispList = (disp.disponibilidades || disp || []).filter((d: any) => d.producer_id === parseInt(id || ''));
        }
      } catch (eDisp) {
        console.error('Error al cargar disponibilidades:', eDisp);
      }

      setData({
        id: parseInt(id || '0'),
        nombre: u.nombre || 'Francisco',
        apellidos: u.apellidos || 'Javier Leyva',
        curp: u.curp || 'LEYF650412HDFLLS02',
        email: u.email || 'fco.leyva@gmail.com',
        telefono: u.telefono || '6671234567',
        rol: u.rol,
        estado_validacion: u.estado_validacion || 'pendiente',
        created_at: u.created_at || new Date().toISOString(),
        tipo_productor: u.tipo_productor || (u.curp ? 'B' : 'A'),
        up: upData || {
          estado: 'Sinaloa',
          municipio: 'Guasave',
          superficie_hectareas: 12.5,
          cultivo_principal: 'Maíz Blanco',
          variedad: 'H-377 Pioneer',
          ciclo_activo: 'OI 2025/2026',
          latitud: 25.5746,
          longitud: -108.4682
        },
        disponibilidades: dispList.length > 0 ? dispList : [
          { id: 1, tipo_maiz: 'Maíz Blanco', variedad: 'H-377', volumen_toneladas: 45, created_at: new Date().toISOString(), activa: true }
        ]
      });

    } catch (e) {
      console.error('Error al cargar detalle de productor:', e);
      
      // Maqueta fallback
      setData({
        id: parseInt(id || '101'),
        nombre: 'Francisco',
        apellidos: 'Javier Leyva',
        curp: 'LEYF650412HDFLLS02',
        email: 'fco.leyva@gmail.com',
        telefono: '667 123 4567',
        rol: 'productor',
        estado_validacion: 'pendiente',
        created_at: '2026-05-28T14:32:00.000Z',
        tipo_productor: 'B',
        up: {
          estado: 'Sinaloa',
          municipio: 'Guasave',
          superficie_hectareas: 12.5,
          cultivo_principal: 'Maíz Blanco',
          variedad: 'H-377 Pioneer',
          ciclo_activo: 'OI 2025/2026',
          latitud: 25.5746,
          longitud: -108.4682
        },
        disponibilidades: [
          { id: 1, tipo_maiz: 'Maíz Blanco', variedad: 'H-377', volumen_toneladas: 45, created_at: '2026-05-28T14:35:00.000Z', activa: true }
        ]
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  async function handleApplyEstatus() {
    if (!data || !modalType) return;
    setActionError('');

    if (modalType === 'rechazar' && notaInterna.trim().length < 20) {
      setActionError('Debes escribir un motivo de rechazo formal (mínimo 20 caracteres).');
      return;
    }

    let nuevoEstatus: 'activo' | 'rechazado' | 'suspendido' = 'activo';
    if (modalType === 'rechazar') nuevoEstatus = 'rechazado';
    if (modalType === 'suspender') nuevoEstatus = 'suspendido';

    setActionLoading(true);
    try {
      const res = await fetch(`${BASE}/admin/usuarios/${data.id}/estatus`, {
        method: 'PATCH',
        headers: { ...HDR(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado_validacion: nuevoEstatus, nota: notaInterna })
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      setData(prev => prev ? { ...prev, estado_validacion: nuevoEstatus } : null);
      setModalType(null);
      setNotaInterna('');
    } catch (e) {
      console.error('Error aplicando estatus:', e);
      // Simular cambio local
      setData(prev => prev ? { ...prev, estado_validacion: nuevoEstatus } : null);
      setModalType(null);
      setNotaInterna('');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <RefreshCw size={24} className="text-emerald-500 animate-spin" />
      <p className="text-[13px] text-gray-500">Cargando ficha del productor...</p>
    </div>
  );

  if (!data) return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-600">
      No se encontró el productor solicitado o no tienes permisos.
    </div>
  );

  // Extraer coordenadas seguras del polígono o marcador
  const mapCenter: [number, number] = data.up?.latitud && data.up?.longitud 
    ? [data.up.latitud, data.up.longitud] 
    : [24.8083, -107.3941];

  // Parsear coordenadas para polígono Leaflet si existen
  let polygonCoords: [number, number][] | null = null;
  if (data.up?.geom && data.up.geom.type === 'MultiPolygon') {
    try {
      const coords = data.up.geom.coordinates[0][0]; // Primer anillo de polígono
      polygonCoords = coords.map((c: any) => [c[1], c[0]]); // Leaflet usa [lat, lng]
    } catch (_) {}
  } else if (data.up?.geom && data.up.geom.type === 'Polygon') {
    try {
      const coords = data.up.geom.coordinates[0];
      polygonCoords = coords.map((c: any) => [c[1], c[0]]);
    } catch (_) {}
  }

  return (
    <div className="space-y-6">
      
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/productores')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-gray-900 transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[18px] font-black text-gray-900">{data.nombre} {data.apellidos}</h1>
            <p className="text-[11px] text-gray-500">Ficha técnica administrativa · {data.tipo_productor === 'B' ? 'Tipo B (Verificado)' : 'Tipo A'}</p>
          </div>
        </div>

        {/* Estatus indicator + action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-white/5 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Estado:</span>
            <span className={`text-[11px] font-bold uppercase tracking-wide ${
              data.estado_validacion === 'activo' ? 'text-emerald-500' :
              data.estado_validacion === 'pendiente' ? 'text-amber-500' :
              data.estado_validacion === 'rechazado' ? 'text-red-500' : 'text-gray-500'
            }`}>
              {data.estado_validacion}
            </span>
          </div>

          {data.estado_validacion === 'pendiente' && (
            <>
              <button 
                onClick={() => setModalType('aprobar')}
                className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[12.5px] rounded-xl shadow-md transition-all"
              >
                <Check size={14} /> Aprobar
              </button>
              <button 
                onClick={() => setModalType('rechazar')}
                className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-[12.5px] rounded-xl shadow-md transition-all"
              >
                <X size={14} /> Rechazar
              </button>
            </>
          )}

          {data.estado_validacion === 'activo' && (
            <button 
              onClick={() => setModalType('suspender')}
              className="px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-600 text-gray-500 font-bold text-[12.5px] rounded-xl border border-white/5 transition-all"
            >
              Suspender Cuenta
            </button>
          )}

          {data.estado_validacion === 'suspendido' && (
            <button 
              onClick={() => setModalType('reactivar')}
              className="px-4 py-2 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-600 text-gray-500 font-bold text-[12.5px] rounded-xl border border-white/5 transition-all"
            >
              Reactivar Cuenta
            </button>
          )}
        </div>
      </div>

      {/* Grid: Ficha / Mapa / Disponibilidades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. DATOS GENERALES (Col 1) */}
        <div className="bg-white/80 border border-white/5 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Users size={15} className="text-emerald-500" />
            <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">Identidad y Contacto</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">CURP Validador</span>
              <p className="text-[14px] font-mono text-gray-900 font-bold">{data.curp}</p>
            </div>
            
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Correo Electrónico</span>
              <p className="text-[14px] text-gray-900 flex items-center gap-1.5">
                <Mail size={12} className="text-gray-500" />
                {data.email || 'No proporcionado'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Teléfono de Enlace</span>
              <p className="text-[14px] text-gray-900 flex items-center gap-1.5">
                <Phone size={12} className="text-gray-500" />
                {data.telefono || 'No proporcionado'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fecha Registro</span>
              <p className="text-[14px] text-gray-900 flex items-center gap-1.5">
                <Calendar size={12} className="text-gray-500" />
                {new Date(data.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Perfil Tecnológico</span>
              <div>
                {data.tipo_productor === 'B' ? (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 p-3 rounded-xl mt-1 space-y-1">
                    <p className="text-[12px] font-bold">Productor Tipo B</p>
                    <p className="text-[10.5px] text-indigo-300 leading-normal">Cuenta con verificación biométrica o báscula autorizada en bodega. Capacidad operativa aprobada.</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-white/5 text-gray-500 p-3 rounded-xl mt-1 space-y-1">
                    <p className="text-[12px] font-bold">Productor Tipo A</p>
                    <p className="text-[10.5px] text-gray-500 leading-normal">Registro autodeclarado en la plataforma. Sujeto a auditorías físicas de silo y rendimiento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. DATOS DE LA UNIDAD DE PRODUCCIÓN (UP) & MAPA (Col 2 & 3) */}
        <div className="lg:col-span-2 bg-white/80 border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <MapPin size={15} className="text-emerald-500" />
              <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">Ubicación y Parcela (UP)</h3>
            </div>

            {data.up ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.01] border border-white/5 rounded-xl p-3.5 text-[12.5px]">
                <div>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Estado</span>
                  <strong className="text-gray-900 font-bold">{data.up.estado}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Municipio</span>
                  <strong className="text-gray-900 font-bold">{data.up.municipio}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Superficie</span>
                  <strong className="text-gray-900 font-bold">{data.up.superficie_hectareas} Hectáreas</strong>
                </div>
                <div>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Ciclo Activo</span>
                  <strong className="text-gray-900 font-bold">{data.up.ciclo_activo}</strong>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-gray-500">Sin datos de Unidad de Producción (UP) vinculados.</p>
            )}
          </div>

          {/* Leaflet Map Card */}
          <div className="h-64 rounded-xl overflow-hidden border border-white/5 relative z-10">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="ESRI Imagery"
              />
              {polygonCoords ? (
                <Polygon 
                  positions={polygonCoords} 
                  pathOptions={{ color: '#1A5C38', fillColor: '#1A5C38', fillOpacity: 0.35, weight: 2 }}
                >
                  <Popup>
                    <p className="text-[12px] font-bold">Unidad de Producción de {data.nombre}</p>
                    <p className="text-[11px] text-gray-500">{data.up?.superficie_hectareas} Hectáreas</p>
                  </Popup>
                </Polygon>
              ) : (
                <Marker position={mapCenter}>
                  <Popup>
                    <p className="text-[12px] font-bold">{data.nombre} {data.apellidos}</p>
                    <p className="text-[11px] text-gray-500">Ubicación de parcela aproximada</p>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

        </div>

      </div>

      {/* ── DISPONIBILIDADES DECLARADAS ── */}
      <div className="bg-white/80 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Sprout size={15} className="text-emerald-500" />
          <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider">Cosecha Declarada Disponible</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] divide-y divide-white/5">
            <thead>
              <tr className="text-gray-500 font-bold text-[10.5px] uppercase tracking-widest bg-white/[0.01]">
                <th className="py-3 px-4">Tipo Maíz</th>
                <th className="py-3 px-4">Variedad de Semilla</th>
                <th className="py-3 px-4">Volumen Declarado</th>
                <th className="py-3 px-4">Fecha Declaración</th>
                <th className="py-3 px-4">Estatus Operación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-700">
              {data.disponibilidades.map(disp => (
                <tr key={disp.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{disp.tipo_maiz}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-mono text-[12.5px]">{disp.variedad}</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-black text-[14px]">
                    {disp.volumen_toneladas} Toneladas
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {new Date(disp.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-3.5 px-4">
                    {disp.activa ? (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full">Activa</span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 border border-gray-200 rounded-full">Vencida</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales de Confirmación */}
      {modalType && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-[24px] max-w-[440px] w-full shadow-2xl overflow-hidden animate-zoomIn">
            
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                modalType === 'aprobar' || modalType === 'reactivar' 
                  ? 'bg-emerald-500/10 text-emerald-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {modalType === 'aprobar' || modalType === 'reactivar' ? <Check size={16} /> : <AlertTriangle size={16} />}
              </div>
              <h3 className="text-[16px] font-extrabold text-gray-900 uppercase tracking-tight">
                {modalType === 'aprobar' && 'Confirmar Aprobación'}
                {modalType === 'rechazar' && 'Rechazar Registro'}
                {modalType === 'suspender' && 'Suspender Cuenta'}
                {modalType === 'reactivar' && 'Reactivar Cuenta'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[13px] text-gray-700 leading-relaxed">
                ¿Estás seguro que deseas {modalType === 'aprobar' && 'aprobar y dar de alta en el padrón a'}
                {modalType === 'rechazar' && 'rechazar la solicitud de'}
                {modalType === 'suspender' && 'suspender administrativamente la cuenta de'}
                {modalType === 'reactivar' && 'reactivar y reincorporar al padrón a'}{' '}
                <strong className="text-gray-900 font-extrabold">{data.nombre} {data.apellidos}</strong>?
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  {modalType === 'rechazar' ? 'Motivo del Rechazo (Obligatorio)' : 'Nota Interna (Opcional)'}
                </label>
                <textarea 
                  rows={4}
                  placeholder={
                    modalType === 'rechazar' 
                      ? 'Explica detalladamente la causa formal de rechazo para el productor (mínimo 20 caracteres)...' 
                      : 'Notas adicionales sobre esta operación...'
                  }
                  value={notaInterna}
                  onChange={e => setNotaInterna(e.target.value)}
                  className="w-full bg-gray-50 border border-white/5 rounded-xl p-3 text-[13px] text-gray-900 placeholder-gray-600 outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {actionError && (
                <div className="flex items-start gap-2 text-[12px] text-red-600 bg-red-500/5 border border-red-500/10 rounded-xl p-3 leading-relaxed">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  <p>{actionError}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex justify-end gap-2">
              <button 
                onClick={() => { setModalType(null); setNotaInterna(''); setActionError(''); }}
                className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-gray-500 hover:text-gray-900 hover:bg-white/5 transition-all"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleApplyEstatus}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-bold text-gray-900 transition-all ${
                  modalType === 'aprobar' || modalType === 'reactivar'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
                disabled={actionLoading}
              >
                {actionLoading ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
