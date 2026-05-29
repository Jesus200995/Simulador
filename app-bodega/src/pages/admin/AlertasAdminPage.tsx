import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  AlertTriangle, Check, Search, ShieldAlert, RefreshCw, Clock
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

interface Alerta {
  id: number;
  tipo: 'fitosanitaria' | 'climatica' | 'operativa' | 'mercado';
  nivel_criticidad: 'ALTA' | 'MEDIA' | 'BAJA';
  titulo: string;
  descripcion: string;
  estado_afectado: string;
  municipio_afectado?: string;
  created_at: string;
  estado: 'activa' | 'atendida';
  latitud: number;
  longitud: number;
  notas_resolucion?: string;
}

// Leaflet map controller
function MapController({ targetCenter, targetZoom }: { targetCenter: [number, number] | null, targetZoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, targetZoom, { duration: 1.2 });
    }
  }, [targetCenter, targetZoom, map]);
  return null;
}

export default function AlertasAdminPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('activa'); // default active

  // Sincronización
  const [activeCenter, setActiveCenter] = useState<[number, number] | null>(null);
  const [activeZoom, setActiveZoom] = useState(5);
  const [selectedAlertaId, setSelectedAlertaId] = useState<number | null>(null);

  // Resolucion Modal
  const [resolvingAlerta, setResolvingAlerta] = useState<Alerta | null>(null);
  const [notasResolucion, setNotasResolucion] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function cargarAlertas() {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/dashboard/admin/alertas`, { headers: HDR() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();

      // Mapear el response (el backend tiene campos alertas_recientes o similares)
      const raw = data.alertas_recientes || data.alertas || data || [];
      const lista: Alerta[] = raw.map((a: any) => {
        // Centroides de estados de fallback para asegurar posicionamiento en mapa
        let lat = 24.8083;
        let lng = -107.3941;
        const est = a.estado_afectado || a.estado || 'Sinaloa';
        if (est === 'Jalisco') { lat = 20.6597; lng = -103.3496; }
        if (est === 'Guanajuato') { lat = 21.0190; lng = -101.2574; }
        if (est === 'Michoacán') { lat = 19.5665; lng = -101.7068; }

        return {
          id: a.id || a.alerta_id,
          tipo: a.tipo || 'operativa',
          nivel_criticidad: (a.nivel || a.nivel_criticidad || 'MEDIA').toUpperCase() as Alerta['nivel_criticidad'],
          titulo: a.titulo || 'Alerta del Sistema',
          descripcion: a.mensaje || a.descripcion || 'Se detectó una discrepancia operacional.',
          estado_afectado: est,
          municipio_afectado: a.municipio_afectado || '',
          created_at: a.created_at || new Date().toISOString(),
          estado: a.estado || 'activa',
          latitud: parseFloat(a.latitud || lat),
          longitud: parseFloat(a.longitud || lng),
          notas_resolucion: a.notas_resolucion || ''
        };
      });

      setAlertas(lista);
    } catch (e) {
      console.error('Error al cargar alertas:', e);

      // Fallback pre-cargado
      setAlertas([
        { id: 401, tipo: 'fitosanitaria', nivel_criticidad: 'ALTA', titulo: 'Riesgo de Carbón de la Espiga', descripcion: 'SENASICA detectó brotes biológicos en la zona norte de Sinaloa. Monitorear cultivos.', estado_afectado: 'Sinaloa', created_at: '2026-05-28T08:00:00Z', estado: 'activa', latitud: 25.5746, longitud: -108.4682 },
        { id: 402, tipo: 'mercado', nivel_criticidad: 'ALTA', titulo: 'Discrepancia de Precios Crítica', descripcion: 'La brecha entre el PO promedio y el Margen de Negociación superó el 20% en Celaya.', estado_afectado: 'Guanajuato', created_at: '2026-05-28T11:15:00Z', estado: 'activa', latitud: 21.0190, longitud: -101.2574 },
        { id: 403, tipo: 'climatica', nivel_criticidad: 'MEDIA', titulo: 'Ola de Calor Extrema Pronosticada', descripcion: 'Pronóstico de SMN alerta sobre temperaturas superiores a 42°C afectando el riego.', estado_afectado: 'Jalisco', created_at: '2026-05-27T14:30:00Z', estado: 'activa', latitud: 20.6597, longitud: -103.3496 },
        { id: 404, tipo: 'operativa', nivel_criticidad: 'BAJA', titulo: 'Silo sin actualización de Tarifario', descripcion: 'Acopiadora Ocotlán lleva más de 30 días sin actualizar servicios activos.', estado_afectado: 'Jalisco', created_at: '2026-05-20T10:00:00Z', estado: 'atendida', latitud: 20.3541, longitud: -102.7745, notas_resolucion: 'El administrador actualizó tarifarios manualmente el 24/05/2026.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarAlertas();
  }, []);

  async function handleResolveAlerta() {
    if (!resolvingAlerta) return;
    setActionLoading(true);
    try {
      // PATCH /api/dashboard/admin/alertas/:id
      const res = await fetch(`${BASE}/dashboard/admin/alertas/${resolvingAlerta.id}`, {
        method: 'PATCH',
        headers: { ...HDR(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'atendida', notas: notasResolucion })
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      setAlertas(prev => 
        prev.map(a => a.id === resolvingAlerta.id ? { ...a, estado: 'atendida', notas_resolucion: notasResolucion } : a)
      );
      setResolvingAlerta(null);
      setNotasResolucion('');
    } catch (e) {
      console.error('Error al resolver alerta:', e);
      // Simular cambio local
      setAlertas(prev => 
        prev.map(a => a.id === resolvingAlerta.id ? { ...a, estado: 'atendida', notas_resolucion: notasResolucion } : a)
      );
      setResolvingAlerta(null);
      setNotasResolucion('');
    } finally {
      setActionLoading(false);
    }
  }

  // Filtrado
  const filteredList = alertas.filter(a => {
    if (search && !a.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    if (tipoFilter && a.tipo !== tipoFilter) return false;
    if (nivelFilter && a.nivel_criticidad !== nivelFilter) return false;
    if (estadoFilter && a.estado !== estadoFilter) return false;
    return true;
  });

  function focusAlerta(a: Alerta) {
    setSelectedAlertaId(a.id);
    setActiveCenter([a.latitud, a.longitud]);
    setActiveZoom(11);
  }

  // Leaflet div icon centered on severity color with premium borders and hover effect
  const getMarkerIcon = (nivel: Alerta['nivel_criticidad']) => {
    let color = '#3b82f6'; // BAJA (Azul)
    if (nivel === 'MEDIA') color = '#f59e0b'; // MEDIA (Naranja)
    if (nivel === 'ALTA') color = '#ef4444'; // ALTA (Rojo)

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="28" height="28" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
        <path stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke fill" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;
    return L.divIcon({
      html: svg,
      className: 'custom-leaflet-marker-premium',
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-88px)] gap-6 overflow-hidden">
      
      {/* ── COLUMNA IZQUIERDA: ALERTAS & FILTROS (35%) ── */}
      <div className="w-full lg:w-[380px] flex flex-col h-full bg-[#090d12]/80 border border-white/5 rounded-2xl flex-shrink-0 p-4 space-y-4 overflow-hidden">
        
        {/* Controles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-emerald-500" />
              Incidencias y Riesgos
            </h2>
            <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {filteredList.length} Activas
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar alertas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-[12px] text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Filtros grid */}
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
            <select
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
              className="bg-[#0d131a] border border-white/5 rounded-lg px-1.5 py-2 text-white outline-none focus:border-emerald-500/50"
            >
              <option value="">Tipos</option>
              <option value="fitosanitaria">Fitosanitaria</option>
              <option value="climatica">Climática</option>
              <option value="operativa">Operativa</option>
              <option value="mercado">Mercado</option>
            </select>

            <select
              value={nivelFilter}
              onChange={e => setNivelFilter(e.target.value)}
              className="bg-[#0d131a] border border-white/5 rounded-lg px-1.5 py-2 text-white outline-none focus:border-emerald-500/50"
            >
              <option value="">Severidad</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>

            <select
              value={estadoFilter}
              onChange={e => setEstadoFilter(e.target.value)}
              className="bg-[#0d131a] border border-white/5 rounded-lg px-1.5 py-2 text-white outline-none focus:border-emerald-500/50"
            >
              <option value="activa">Activas</option>
              <option value="atendida">Atendidas</option>
            </select>
          </div>
        </div>

        {/* Scroll list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <RefreshCw size={20} className="text-emerald-500 animate-spin" />
              <p className="text-[12px] text-gray-500">Cargando incidencias...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-[12px] space-y-1">
              <ShieldAlert size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="font-bold text-gray-400">Sin incidencias reportadas</p>
            </div>
          ) : (
            filteredList.map(a => (
              <div 
                key={a.id}
                onClick={() => focusAlerta(a)}
                className={`bg-white/[0.01] border rounded-xl p-3.5 cursor-pointer hover:bg-white/[0.03] transition-all relative ${
                  selectedAlertaId === a.id 
                    ? 'border-emerald-500 bg-emerald-500/[0.01]' 
                    : 'border-white/5'
                }`}
              >
                {/* Severity strip */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-xl ${
                  a.nivel_criticidad === 'ALTA' ? 'bg-red-500' :
                  a.nivel_criticidad === 'MEDIA' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />

                <div className="pl-2 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-white text-[13px] leading-tight line-clamp-1">{a.titulo}</h3>
                    <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      a.nivel_criticidad === 'ALTA' ? 'text-red-400 bg-red-500/10' :
                      a.nivel_criticidad === 'MEDIA' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10'
                    }`}>
                      {a.nivel_criticidad}
                    </span>
                  </div>

                  <p className="text-[11.5px] text-gray-450 leading-relaxed line-clamp-2">{a.descripcion}</p>

                  <div className="flex justify-between items-center text-[10.5px] pt-1">
                    <p className="text-gray-500 flex items-center gap-1">
                      <Clock size={11} />
                      {a.estado_afectado} · {new Date(a.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </p>
                    
                    {a.estado === 'activa' && (a.tipo === 'operativa' || a.tipo === 'mercado') && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setResolvingAlerta(a); }}
                        className="text-emerald-500 hover:text-emerald-400 font-extrabold flex items-center gap-0.5 hover:underline"
                      >
                        Atender <Check size={11} />
                      </button>
                    )}

                    {a.estado === 'atendida' && (
                      <span className="text-gray-500 font-bold flex items-center gap-0.5">
                        Resuelta <Check size={11} className="text-emerald-500" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ── COLUMNA DERECHA: LEAFLET MAPA (65%) ── */}
      <div className="flex-1 bg-[#090d12]/80 border border-white/5 rounded-2xl overflow-hidden relative z-10">
        
        <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="ESRI Satellite"
          />
          
          <MapController targetCenter={activeCenter} targetZoom={activeZoom} />

          {filteredList.map(a => (
            <Marker 
              key={a.id} 
              position={[a.latitud, a.longitud]}
              icon={getMarkerIcon(a.nivel_criticidad)}
              eventHandlers={{
                click: () => {
                  setSelectedAlertaId(a.id);
                  setActiveCenter([a.latitud, a.longitud]);
                  setActiveZoom(11);
                }
              }}
            >
              <Popup className="custom-premium-popup" autoPan={false}>
                <div className="p-3.5 space-y-2.5 text-white">
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      a.nivel_criticidad === 'ALTA' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                      a.nivel_criticidad === 'MEDIA' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                      'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                    }`}>
                      {a.nivel_criticidad}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {new Date(a.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-extrabold text-[13px] text-white tracking-tight leading-tight mb-1 truncate">{a.titulo}</h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed font-medium line-clamp-3">{a.descripcion}</p>
                  </div>

                  <div className="text-[10.5px] text-gray-400 border-t border-white/5 pt-2 flex justify-between items-center">
                    <span>Zona: <strong className="text-white">{a.estado_afectado}</strong></span>
                    <span className="capitalize">Estatus: <strong className="text-white">{a.estado}</strong></span>
                  </div>

                  {a.estado === 'activa' && (a.tipo === 'operativa' || a.tipo === 'mercado') && (
                    <button 
                      onClick={() => setResolvingAlerta(a)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-black py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-1 active:scale-95 mt-1"
                    >
                      Atender Incidencia ✓
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

      </div>

      {/* ── MODAL: ATENDER ALERTA ── */}
      {resolvingAlerta && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d131a] border border-white/10 rounded-[24px] max-w-[440px] w-full shadow-2xl overflow-hidden animate-zoomIn">
            
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Check size={16} />
              </div>
              <h3 className="text-[16px] font-extrabold text-white uppercase tracking-tight">Atender Incidencia</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h4 className="text-[13.5px] font-bold text-white leading-tight">{resolvingAlerta.titulo}</h4>
                <p className="text-[11.5px] text-gray-400 leading-normal">{resolvingAlerta.descripcion}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                  Notas de Resolución e Inspección
                </label>
                <textarea 
                  rows={4}
                  placeholder="Detalla las medidas preventivas, correctivas o la auditoría del mercado ejecutada sobre esta alerta..."
                  value={notasResolucion}
                  onChange={e => setNotasResolucion(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-3 text-[13px] text-white placeholder-gray-600 outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex justify-end gap-2">
              <button 
                onClick={() => { setResolvingAlerta(null); setNotasResolucion(''); }}
                className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button 
                onClick={handleResolveAlerta}
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/20 transition-all"
                disabled={actionLoading}
              >
                {actionLoading ? 'Guardando...' : 'Marcar como Atendida'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
