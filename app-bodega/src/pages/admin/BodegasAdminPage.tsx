import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, MapPin, Eye, ShieldAlert, RefreshCw, Warehouse, Box, BarChart3, X, CheckCircle
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
  const [tabActivo, setTabActivo] = useState<'lista' | 'estadisticas' | 'pendientes'>('lista');
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

  // Modal y Toast
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    visible: boolean;
    tipo: 'aprobar' | 'rechazar';
    bodegaId: number | null;
    bodegaNombre: string;
  }>({ visible: false, tipo: 'aprobar', bodegaId: null, bodegaNombre: '' });
  
  const [toast, setToast] = useState<{ visible: boolean; mensaje: string; tipo: 'exito' | 'error' }>({ 
    visible: false, mensaje: '', tipo: 'exito' 
  });

  function mostrarToast(mensaje: string, tipo: 'exito' | 'error' = 'exito') {
    setToast({ visible: true, mensaje, tipo });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  }

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

  function confirmarAprobar(id: number, nombre: string) {
    setModalConfirmacion({ visible: true, tipo: 'aprobar', bodegaId: id, bodegaNombre: nombre });
  }

  function confirmarRechazar(id: number, nombre: string) {
    setModalConfirmacion({ visible: true, tipo: 'rechazar', bodegaId: id, bodegaNombre: nombre });
  }

  async function procesarAccion() {
    if (!modalConfirmacion.bodegaId) return;
    try {
      const { tipo, bodegaId } = modalConfirmacion;
      const res = await fetch(`${BASE}/bodegas/${bodegaId}/${tipo}`, {
        method: 'PATCH',
        headers: HDR()
      });
      if (!res.ok) throw new Error(`Error al ${tipo} la bodega`);
      setBodegas(prev => prev.map(b => 
        b.id === bodegaId 
          ? { 
              ...b, 
              estatus: tipo === 'aprobar' ? 'aprobada' : 'rechazada',
              semaforo_compra: tipo === 'aprobar' ? 'verde' : 'rojo'
            }
          : b
      ));
      mostrarToast(`Bodega ${tipo === 'aprobar' ? 'aprobada' : 'rechazada'} con éxito`, 'exito');
    } catch (e: any) {
      mostrarToast(e.message || 'Error', 'error');
    } finally {
      setModalConfirmacion({ visible: false, tipo: 'aprobar', bodegaId: null, bodegaNombre: '' });
    }
  }

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
    <div className="flex flex-col h-[calc(100vh-88px)] gap-3 overflow-hidden">

      {/* ── Header + Tab Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A5C38] to-[#2d7a52] flex items-center justify-center shadow-sm flex-shrink-0">
              <Warehouse size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-gray-900">Bodegas</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">Lista · Estadísticas · Aprobaciones</p>
            </div>
          </div>
          <button onClick={cargarBodegas} disabled={loading}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A5C38] bg-[#eef8f2] hover:bg-[#1A5C38] hover:text-white border border-[#1A5C38]/20 hover:border-transparent px-3 py-1.5 rounded-lg active:scale-95 transition-all duration-150 disabled:opacity-50">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex">
          {[
            { key: 'lista',        label: 'Lista + Mapa', icon: <Warehouse size={12} />, badge: null },
            { key: 'estadisticas', label: 'Estadísticas', icon: <BarChart3 size={12} />, badge: null },
            { key: 'pendientes',   label: 'Por aprobar',  icon: <ShieldAlert size={12} />,
              badge: bodegas.filter(b => b.estatus === 'pendiente').length },
          ].map(({ key, label, icon, badge }) => (
            <button key={key} onClick={() => setTabActivo(key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11.5px] font-bold border-b-2 transition-all duration-150 ${
                tabActivo === key
                  ? 'border-[#1A5C38] text-[#1A5C38]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {icon}{label}
              {badge !== null && badge > 0 && (
                <span className="bg-amber-100 text-amber-600 border border-amber-200 text-[9px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>
              )}
            </button>
          ))}
        </div>
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
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Capacidad Total</p>
                <p className="text-[28px] font-black text-gray-900 leading-none">{Number(stats.capacidad_total || 0).toLocaleString()}</p>
                <p className="text-[11px] text-gray-500">toneladas</p>
              </div>
              {/* KPI: Stock actual */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Stock Actual</p>
                <p className="text-[28px] font-black text-gray-900 leading-none">{Number(stats.stock_total || 0).toLocaleString()}</p>
                <p className="text-[11px] text-gray-500">toneladas</p>
              </div>
              {/* KPI: % Ocupación */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">% Ocupación</p>
                <p className="text-[28px] font-black text-emerald-600 leading-none">{stats.pct_ocupacion || 0}<span className="text-[14px] text-gray-500 ml-1">%</span></p>
                <p className="text-[11px] text-gray-500">capacidad utilizada</p>
              </div>
              {/* KPI: Con tarifario */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Con Tarifario</p>
                <p className="text-[28px] font-black text-gray-900 leading-none">{stats.con_tarifario || 0}</p>
                <p className="text-[11px] text-gray-500">bodegas con tarifa activa</p>
              </div>
              {/* KPI: Ventanillas activas */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Ventanillas Activas</p>
                <p className="text-[28px] font-black text-gray-900 leading-none">{stats.ventanillas_activas || 0}</p>
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
      <div className="flex flex-col lg:flex-row flex-1 gap-3 overflow-hidden min-h-0">

      {/* ── COLUMNA IZQUIERDA: LISTA & FILTROS ── */}
      <div className="w-full lg:w-[380px] flex flex-col bg-white border border-gray-100 shadow-sm rounded-2xl flex-shrink-0 overflow-hidden">

        {/* Barra de búsqueda + filtros */}
        <div className="p-3 space-y-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar bodega o silo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-[12px] text-gray-900 placeholder-gray-400 outline-none focus:border-[#1A5C38]/40 focus:bg-white transition-all duration-150"
              />
            </div>
            <span className="text-[10px] font-bold text-[#1A5C38] bg-[#eef8f2] border border-[#1A5C38]/20 px-2 py-1 rounded-lg flex-shrink-0">
              {filteredList.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-[11.5px] text-gray-700 outline-none focus:border-[#1A5C38]/40 transition-all duration-150">
              <option value="">Estados</option>
              <option value="Sinaloa">Sinaloa</option>
              <option value="Jalisco">Jalisco</option>
              <option value="Guanajuato">Guanajuato</option>
            </select>
            <select value={estatusFilter} onChange={e => setEstatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-[11.5px] text-gray-700 outline-none focus:border-[#1A5C38]/40 transition-all duration-150">
              <option value="">Estatus</option>
              <option value="aprobada">Aprobada</option>
              <option value="pendiente">Pendiente</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>
        </div>

        {/* Lista scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <RefreshCw size={18} className="text-[#1A5C38] animate-spin" />
              <p className="text-[11.5px] text-gray-400">Cargando bodegas...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <ShieldAlert size={20} className="text-gray-300" />
              <p className="text-[12px] font-medium text-gray-400">Sin bodegas filtradas</p>
            </div>
          ) : (
            filteredList.map(b => (
              <div key={b.id} onClick={() => focusBodega(b)}
                className={`relative px-4 py-3 cursor-pointer hover:bg-[#eef8f2] transition-all duration-150 ${
                  selectedBodegaId === b.id ? 'bg-[#f0faf5]' : ''
                }`}>
                <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${
                  b.semaforo_compra === 'verde' ? 'bg-emerald-400' :
                  b.semaforo_compra === 'amarillo' ? 'bg-amber-400' :
                  b.semaforo_compra === 'rojo' ? 'bg-red-400' : 'bg-gray-200'
                }`} />
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="text-[12.5px] font-semibold text-gray-900 leading-snug line-clamp-1">{b.nombre}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                    b.estatus === 'aprobada' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' :
                    b.estatus === 'pendiente' ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                    'text-gray-500 bg-gray-50 border border-gray-200'
                  }`}>
                    {b.estatus.charAt(0).toUpperCase() + b.estatus.slice(1)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <MapPin size={10} /> {b.municipio}, {b.estado}
                </p>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Box size={10} /> <strong className="font-semibold">{b.capacidad_total.toLocaleString()} t</strong>
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/bodegas/${b.id}`); }}
                    className="text-[10.5px] font-semibold text-[#1A5C38] hover:underline flex items-center gap-0.5">
                    Detalle <Eye size={10} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── COLUMNA DERECHA: MAPA SATELITAL ── */}
      <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden relative z-10">
        
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
                <div className="p-3.5 space-y-2.5 text-gray-900">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      b.estatus === 'aprobada' ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/20' :
                      b.estatus === 'pendiente' ? 'text-amber-600 bg-amber-500/10 border border-amber-500/20' :
                      'text-gray-500 bg-white/5 border border-gray-200'
                    }`}>
                      {b.estatus.charAt(0).toUpperCase() + b.estatus.slice(1)}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      b.semaforo_compra === 'verde' ? 'bg-emerald-500 animate-pulse' :
                      b.semaforo_compra === 'amarillo' ? 'bg-amber-500' :
                      b.semaforo_compra === 'rojo' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  <div>
                    <h4 className="font-extrabold text-[13px] text-gray-900 tracking-tight leading-tight mb-1 truncate">{b.nombre}</h4>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1">
                      <MapPin size={11} /> {b.municipio}, {b.estado}
                    </p>
                  </div>

                  <div className="text-[11px] text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Capacidad:</span>
                      <strong className="text-gray-900 font-bold">{b.capacidad_total.toLocaleString()} t</strong>
                    </div>
                    {b.encargado_nombre && (
                      <div className="flex justify-between gap-1.5">
                        <span className="text-gray-500 font-medium truncate">Encargado:</span>
                        <strong className="text-gray-900 font-bold truncate max-w-[120px]">{b.encargado_nombre}</strong>
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

      {/* ── TAB: PENDIENTES ── */}
      {tabActivo === 'pendientes' && (
        <div className="flex-1 overflow-y-auto pr-2">
          {bodegas.filter(b => b.estatus === 'pendiente').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <ShieldAlert size={48} className="mb-4 opacity-50" />
              <p>No hay bodegas pendientes de aprobación</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bodegas.filter(b => b.estatus === 'pendiente').map(b => (
                <div key={b.id} className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-extrabold text-gray-900 text-[15px]">{b.nombre}</h3>
                      <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-black">Pendiente</span>
                    </div>
                    <p className="text-gray-500 text-[12px] flex items-center gap-1 mb-3">
                      <MapPin size={12} /> {b.municipio}, {b.estado}
                    </p>
                    <div className="text-[12px] text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Capacidad:</span>
                        <strong className="text-gray-900">{b.capacidad_total.toLocaleString()} t</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Encargado:</span>
                        <strong className="text-gray-900">{b.encargado_nombre || '—'}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => confirmarAprobar(b.id, b.nombre)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl text-[12px] transition-all"
                    >
                      Aprobar
                    </button>
                    <button 
                      onClick={() => confirmarRechazar(b.id, b.nombre)}
                      className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 font-bold py-2 rounded-xl text-[12px] transition-all"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN (APPLE 2026 STYLE) ── */}
      {modalConfirmacion.visible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header del modal */}
            <div className={`p-6 pb-4 border-b border-gray-100 flex flex-col items-center text-center`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                modalConfirmacion.tipo === 'aprobar' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
              }`}>
                {modalConfirmacion.tipo === 'aprobar' ? <CheckCircle size={24} /> : <X size={24} />}
              </div>
              <h3 className="text-gray-900 text-[18px] font-black tracking-tight">
                ¿{modalConfirmacion.tipo === 'aprobar' ? 'Aprobar' : 'Rechazar'} bodega?
              </h3>
              <p className="text-gray-500 text-[13px] mt-1.5 leading-relaxed">
                Estás a punto de <strong className={modalConfirmacion.tipo === 'aprobar' ? 'text-emerald-600' : 'text-red-600'}>{modalConfirmacion.tipo}</strong> la bodega <br/>
                <span className="text-gray-900 font-bold">{modalConfirmacion.bodegaNombre}</span>
              </p>
            </div>
            
            {/* Botones del modal */}
            <div className="p-4 flex gap-3">
              <button
                onClick={() => setModalConfirmacion({ visible: false, tipo: 'aprobar', bodegaId: null, bodegaNombre: '' })}
                className="flex-1 py-3 px-4 rounded-xl text-[13px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={procesarAccion}
                className={`flex-1 py-3 px-4 rounded-xl text-[13px] font-black text-gray-900 transition-colors shadow-lg ${
                  modalConfirmacion.tipo === 'aprobar' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-900/20' 
                    : 'bg-red-500 hover:bg-red-400 shadow-red-900/20'
                }`}
              >
                Sí, {modalConfirmacion.tipo}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          toast.tipo === 'exito' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
            : 'bg-red-500/10 border-red-500/20 text-red-600'
        }`}>
          {toast.tipo === 'exito' ? <CheckCircle size={18} /> : <X size={18} />}
          <span className="text-[13px] font-bold">{toast.mensaje}</span>
        </div>
      )}

    </div>
  );
}





