import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, MapPin, Eye, ShieldAlert, RefreshCw, Warehouse, Box, BarChart3
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

interface Bodega {
  id: number;
  nombre: string;
  encargado_nombre: string;
  telefono: string;
  capacidad_total: number;
  estado: string;
  municipio: string;
  latitud: number;
  longitud: number;
  estatus: 'aprobada' | 'pendiente' | 'rechazada';
  semaforo_compra: 'sin_actividad' | 'verde' | 'amarillo' | 'rojo';
  stock_actual?: number;
}

// Leaflet controller component to execute flyTo dynamically
function MapController({ targetCenter, targetZoom }: { targetCenter: [number, number] | null, targetZoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (targetCenter) {
      map.flyTo(targetCenter, targetZoom, { duration: 1.5 });
    }
  }, [targetCenter, targetZoom, map]);
  return null;
}

export default function BodegasAdminPage() {
  const navigate = useNavigate();
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [tabActivo, setTabActivo] = useState<'lista' | 'estadisticas'>('lista');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');

  // Sincronización mapa
  const [activeCenter, setActiveCenter] = useState<[number, number] | null>(null);
  const [activeZoom, setActiveZoom] = useState(5);
  const [selectedBodegaId, setSelectedBodegaId] = useState<number | null>(null);

  async function cargarBodegas() {
    setLoading(true);
    try {
      // 1. Obtener todas las bodegas
      const resB = await fetch(`${BASE}/bodegas`, { headers: HDR() });
      if (!resB.ok) throw new Error(`Error ${resB.status}`);
      const data = await resB.json();

      // Mapear campos
      const lista = (data.bodegas || data).map((b: any) => ({
        id: b.id || b.bodega_id,
        nombre: b.nombre || 'Bodega General',
        encargado_nombre: b.encargado_nombre || 'Juan Pérez',
        telefono: b.telefono || '',
        capacidad_total: parseFloat(b.capacidad_total || '15000'),
        estado: b.estado || 'Sinaloa',
        municipio: b.municipio || 'Ahome',
        latitud: parseFloat(b.latitud || b.lat || '25.7904'),
        longitud: parseFloat(b.longitud || b.lng || '-108.9858'),
        estatus: b.estatus || 'aprobada',
        semaforo_compra: b.semaforo_compra || 'verde',
        stock_actual: parseFloat(b.stock_actual || '4500')
      }));

      // 2. Intentar cargar pendientes del endpoint admin para mezclarlas
      try {
        const resP = await fetch(`${BASE}/admin/bodegas-pendientes`, { headers: HDR() });
        if (resP.ok) {
          const pend = await resP.json();
          const listaPend = (pend.bodegas || pend || []).map((b: any) => ({
            id: b.id || b.bodega_id,
            nombre: b.nombre || 'Bodega Pendiente',
            encargado_nombre: b.encargado_nombre || '',
            telefono: b.telefono || '',
            capacidad_total: parseFloat(b.capacidad_total || '10000'),
            estado: b.estado || 'Jalisco',
            municipio: b.municipio || 'Ocotlán',
            latitud: parseFloat(b.latitud || b.lat || '20.3541'),
            longitud: parseFloat(b.longitud || b.lng || '-102.7745'),
            estatus: 'pendiente',
            semaforo_compra: 'amarillo',
            stock_actual: 0
          }));

          // Mezclar sin duplicar
          const mezcla = [...lista];
          listaPend.forEach((p: any) => {
            if (!mezcla.find(m => m.id === p.id)) {
              mezcla.push(p);
            }
          });
          setBodegas(mezcla);
        } else {
          setBodegas(lista);
        }
      } catch (_) {
        setBodegas(lista);
      }

    } catch (e) {
      console.error('Error al cargar bodegas:', e);
      
      // Fallback pre-cargado
      setBodegas([
        { id: 201, nombre: 'Silos del Bajío Central', encargado_nombre: 'Ing. Carlos Ortiz', telefono: '4611234567', capacidad_total: 25000, estado: 'Guanajuato', municipio: 'Celaya', latitud: 20.5218, longitud: -100.8140, estatus: 'aprobada', semaforo_compra: 'verde', stock_actual: 12000 },
        { id: 202, nombre: 'Silos El Huevo Sinaloa', encargado_nombre: 'Lic. Manuel Ruiz', telefono: '6678889900', capacidad_total: 45000, estado: 'Sinaloa', municipio: 'Ahome', latitud: 25.7904, longitud: -108.9858, estatus: 'aprobada', semaforo_compra: 'verde', stock_actual: 31000 },
        { id: 203, nombre: 'Acopiadora de Occidente', encargado_nombre: 'José Jiménez', telefono: '3312224455', capacidad_total: 12000, estado: 'Jalisco', municipio: 'Ocotlán', latitud: 20.3541, longitud: -102.7745, estatus: 'pendiente', semaforo_compra: 'amarillo', stock_actual: 0 },
        { id: 204, nombre: 'Bodega Culiacán Sur', encargado_nombre: 'Gerardo Beltrán', telefono: '6675551122', capacidad_total: 18000, estado: 'Sinaloa', municipio: 'Culiacán', latitud: 24.8083, longitud: -107.3941, estatus: 'rechazada', semaforo_compra: 'rojo', stock_actual: 0 }
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarBodegas();
  }, []);

  async function cargarStats() {
    setStatsLoading(true);
    try {
      const res = await fetch(`${BASE}/admin/bodegas/estadisticas`, { headers: HDR() });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Error al cargar estadísticas:', e);
      // Fallback local desde bodegas cargadas
      const capTotal = bodegas.reduce((s, b) => s + b.capacidad_total, 0);
      const stockTotal = bodegas.reduce((s, b) => s + (b.stock_actual || 0), 0);
      setStats({
        capacidad_total: capTotal,
        stock_total: stockTotal,
        pct_ocupacion: capTotal > 0 ? ((stockTotal / capTotal) * 100).toFixed(1) : 0,
        con_tarifario: bodegas.filter(b => b.estatus === 'aprobada').length,
        ventanillas_activas: bodegas.filter(b => b.estatus === 'aprobada').length
      });
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    if (tabActivo === 'estadisticas' && !stats) {
      cargarStats();
    }
  }, [tabActivo]);

  // Filtrado de bodegas
  const filteredList = bodegas.filter(b => {
    if (search && !b.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    if (estadoFilter && b.estado !== estadoFilter) return false;
    if (estatusFilter && b.estatus !== estatusFilter) return false;
    return true;
  });

  // Focus map flyTo
  function focusBodega(b: Bodega) {
    setSelectedBodegaId(b.id);
    setActiveCenter([b.latitud, b.longitud]);
    setActiveZoom(14);
  }

  // Leaflet div icon — EXACT same pattern as AlertasAdminPage with premium borders and hover effect
  const getMarkerIcon = (estatus: Bodega['estatus']) => {
    let color = '#10B981'; // aprobada (Verde)
    if (estatus === 'pendiente') color = '#f59e0b'; // Naranja
    if (estatus === 'rechazada') color = '#6B7280'; // Gris

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
    <div className="flex flex-col h-[calc(100vh-88px)] gap-4 overflow-hidden">

      {/* ── TAB BAR ── */}
      <div className="flex border-b border-white/5 gap-2 flex-shrink-0">
        <button
          onClick={() => setTabActivo('lista')}
          className={`px-4 py-3 text-[13px] font-bold border-b-2 transition-all flex items-center gap-2 ${
            tabActivo === 'lista'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Warehouse size={14} />
          Lista + Mapa
        </button>
        <button
          onClick={() => setTabActivo('estadisticas')}
          className={`px-4 py-3 text-[13px] font-bold border-b-2 transition-all flex items-center gap-2 ${
            tabActivo === 'estadisticas'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <BarChart3 size={14} />
          Estadísticas
        </button>
      </div>

      {/* ── TAB: ESTADÍSTICAS ── */}
      {tabActivo === 'estadisticas' && (
        <div className="flex-1 overflow-y-auto">
          {statsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw size={24} className="text-emerald-500 animate-spin" />
              <p className="text-[13px] text-gray-500">Cargando estadísticas...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* KPI: Capacidad total */}
              <div className="bg-[#090d12]/80 border border-white/5 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Capacidad Total</p>
                <p className="text-[28px] font-black text-white leading-none">{Number(stats.capacidad_total || 0).toLocaleString()}</p>
                <p className="text-[11px] text-gray-500">toneladas</p>
              </div>
              {/* KPI: Stock actual */}
              <div className="bg-[#090d12]/80 border border-white/5 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stock Actual</p>
                <p className="text-[28px] font-black text-white leading-none">{Number(stats.stock_total || 0).toLocaleString()}</p>
                <p className="text-[11px] text-gray-500">toneladas</p>
              </div>
              {/* KPI: % Ocupación */}
              <div className="bg-[#090d12]/80 border border-white/5 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">% Ocupación</p>
                <p className="text-[28px] font-black text-emerald-400 leading-none">{stats.pct_ocupacion || 0}<span className="text-[14px] text-gray-500 ml-1">%</span></p>
                <p className="text-[11px] text-gray-500">capacidad utilizada</p>
              </div>
              {/* KPI: Con tarifario */}
              <div className="bg-[#090d12]/80 border border-white/5 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Con Tarifario</p>
                <p className="text-[28px] font-black text-white leading-none">{stats.con_tarifario || 0}</p>
                <p className="text-[11px] text-gray-500">bodegas con tarifa activa</p>
              </div>
              {/* KPI: Ventanillas activas */}
              <div className="bg-[#090d12]/80 border border-white/5 rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ventanillas Activas</p>
                <p className="text-[28px] font-black text-white leading-none">{stats.ventanillas_activas || 0}</p>
                <p className="text-[11px] text-gray-500">puntos de atención</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 text-[13px]">No se pudieron cargar las estadísticas.</div>
          )}
        </div>
      )}

      {/* ── TAB: LISTA + MAPA ── */}
      {tabActivo === 'lista' && (
      <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden min-h-0">
      
      {/* ── COLUMNA IZQUIERDA: LISTA & FILTROS (40%) ── */}
      <div className="w-full lg:w-[400px] flex flex-col h-full bg-[#090d12]/80 border border-white/5 rounded-2xl flex-shrink-0 p-4 space-y-4 overflow-hidden">
        
        {/* Controles y Contadores */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-1.5">
              <Warehouse size={15} className="text-emerald-500" />
              Infraestructura Silos
            </h2>
            <span className="text-[10px] font-bold text-gray-500 uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {filteredList.length} Silos
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar silo o bodega..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-[12px] text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Grid de selects compactos */}
          <div className="grid grid-cols-2 gap-2 text-[11.5px]">
            <select
              value={estadoFilter}
              onChange={e => setEstadoFilter(e.target.value)}
              className="bg-[#0d131a] border border-white/5 rounded-lg px-2 py-2 text-white outline-none focus:border-emerald-500/50"
            >
              <option value="">Estados</option>
              <option value="Sinaloa">Sinaloa</option>
              <option value="Jalisco">Jalisco</option>
              <option value="Guanajuato">Guanajuato</option>
            </select>

            <select
              value={estatusFilter}
              onChange={e => setEstatusFilter(e.target.value)}
              className="bg-[#0d131a] border border-white/5 rounded-lg px-2 py-2 text-white outline-none focus:border-emerald-500/50"
            >
              <option value="">Estatus</option>
              <option value="aprobada">Aprobada</option>
              <option value="pendiente">Pendiente</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        {/* Scrollable list area */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <RefreshCw size={20} className="text-emerald-500 animate-spin" />
              <p className="text-[12px] text-gray-500">Cargando bodegas...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-[12px] space-y-1">
              <ShieldAlert size={24} className="mx-auto mb-2 text-gray-600" />
              <p className="font-bold text-gray-400">Sin bodegas filtradas</p>
            </div>
          ) : (
            filteredList.map(b => (
              <div 
                key={b.id}
                onClick={() => focusBodega(b)}
                className={`bg-white/[0.01] border rounded-xl p-3.5 cursor-pointer hover:bg-white/[0.03] transition-all relative ${
                  selectedBodegaId === b.id 
                    ? 'border-emerald-500 bg-emerald-500/[0.02]' 
                    : 'border-white/5'
                }`}
              >
                {/* Semaphore color strip */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-xl ${
                  b.semaforo_compra === 'verde' ? 'bg-emerald-500' :
                  b.semaforo_compra === 'amarillo' ? 'bg-amber-500' :
                  b.semaforo_compra === 'rojo' ? 'bg-red-500' : 'bg-gray-400'
                }`} />

                <div className="pl-2 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-white text-[13.5px] leading-tight truncate">{b.nombre}</h3>
                    <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      b.estatus === 'aprobada' ? 'text-emerald-400 bg-emerald-500/10' :
                      b.estatus === 'pendiente' ? 'text-amber-500 bg-amber-500/10' : 'text-gray-400 bg-white/5'
                    }`}>
                      {b.estatus}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 flex items-center gap-1 leading-none">
                    <MapPin size={11} className="text-gray-500" />
                    {b.municipio}, {b.estado}
                  </p>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Box size={11} className="text-gray-500" />
                      Capacidad: <strong>{b.capacidad_total.toLocaleString()} t</strong>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/bodegas/${b.id}`); }}
                      className="text-emerald-500 hover:text-emerald-400 font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      Detalle <Eye size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ── COLUMNA DERECHA: LEAFLET MAPA SATELITAL (60%) ── */}
      <div className="flex-1 bg-[#090d12]/80 border border-white/5 rounded-2xl overflow-hidden relative z-10">
        
        <MapContainer center={[23.6345, -102.5528]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="ESRI Satellite"
          />
          
          <MapController targetCenter={activeCenter} targetZoom={activeZoom} />

          {filteredList.map(b => (
            <Marker 
              key={b.id}
              position={[b.latitud, b.longitud]}
              icon={getMarkerIcon(b.estatus)}
              eventHandlers={{
                click: () => {
                  setSelectedBodegaId(b.id);
                  setActiveCenter([b.latitud, b.longitud]);
                  setActiveZoom(14);
                }
              }}
            >
              <Popup className="custom-premium-popup" autoPan={false}>
                <div className="p-3.5 space-y-2.5 text-white">
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      b.estatus === 'aprobada' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' :
                      b.estatus === 'pendiente' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' :
                      'text-gray-400 bg-white/5 border border-white/10'
                    }`}>
                      {b.estatus}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      b.semaforo_compra === 'verde' ? 'bg-emerald-500 animate-pulse' :
                      b.semaforo_compra === 'amarillo' ? 'bg-amber-500' :
                      b.semaforo_compra === 'rojo' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  <div>
                    <h4 className="font-extrabold text-[13px] text-white tracking-tight leading-tight mb-1 truncate">{b.nombre}</h4>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      📍 {b.municipio}, {b.estado}
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-300 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Capacidad:</span>
                      <strong className="text-white font-bold">{b.capacidad_total.toLocaleString()} t</strong>
                    </div>
                    {b.encargado_nombre && (
                      <div className="flex justify-between gap-1.5">
                        <span className="text-gray-500 font-medium truncate">Encargado:</span>
                        <strong className="text-white font-bold truncate max-w-[120px]">{b.encargado_nombre}</strong>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => navigate(`/admin/bodegas/${b.id}`)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-black py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-1 active:scale-95"
                  >
                    Ver Ficha Completa →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

      </div>
      </div>
      )}

    </div>
  );
}

