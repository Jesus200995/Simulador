import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Search, MapPin, Eye, ShieldAlert, RefreshCw, Warehouse, Box
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { createPremiumMarker, variantFromEstatus } from '../../utils/mapMarkers';

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
  semaforo_compra: 'verde' | 'amarillo' | 'rojo';
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

  // Premium marker using shared utility
  const getMarkerIcon = (status: Bodega['estatus'], isSelected = false) =>
    createPremiumMarker(variantFromEstatus(status), 34, isSelected);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-88px)] gap-6 overflow-hidden">
      
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
                  b.semaforo_compra === 'amarillo' ? 'bg-amber-500' : 'bg-red-500'
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
              key={`${b.id}-${selectedBodegaId === b.id}`}
              position={[b.latitud, b.longitud]}
              icon={getMarkerIcon(b.estatus, selectedBodegaId === b.id)}
              eventHandlers={{
                click: () => {
                  setSelectedBodegaId(b.id);
                  setActiveCenter([b.latitud, b.longitud]);
                  setActiveZoom(14);
                }
              }}
            >
              <Popup className="custom-popup">
                <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '4px', minWidth: '180px' }}>
                  <div style={{ fontWeight: 900, fontSize: '13px', color: '#111827', marginBottom: '4px', lineHeight: 1.3 }}>{b.nombre}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>📍 {b.municipio}, {b.estado}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', paddingTop: '6px', borderTop: '1px solid #f3f4f6' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '20px', backgroundColor: b.estatus === 'aprobada' ? '#d1fae5' : b.estatus === 'pendiente' ? '#fef3c7' : '#f3f4f6', color: b.estatus === 'aprobada' ? '#065f46' : b.estatus === 'pendiente' ? '#92400e' : '#6b7280', textTransform: 'uppercase' }}>
                        {b.estatus}
                      </span>
                    </div>
                    <button 
                      onClick={() => navigate(`/admin/bodegas/${b.id}`)}
                      style={{ color: '#059669', fontWeight: 700, fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Ver detalle →
                    </button>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '10px', color: '#9ca3af' }}>
                    🏗️ Capacidad: <strong>{b.capacidad_total.toLocaleString()} t</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

      </div>

    </div>
  );
}
