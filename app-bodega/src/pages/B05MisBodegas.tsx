import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, MapPin, Warehouse, Circle, List, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../services/api';
import { formatNum } from '../utils/format';

interface Bodega {
  id: number; nombre: string; municipio: string; estado: string;
  semaforo_compra: string; ocupacion_pct: number; stock_actual: number; capacidad_ton: number;
  latitud?: number; longitud?: number;
}

/* Custom green marker for map view */
const greenDot = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#1A5C38;border-radius:50%;border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14] as [number, number],
  iconAnchor: [7, 7] as [number, number],
});

const semaforoMap: Record<string, { label: string; color: string; dot: string; badge: string }> = {
  verde:         { label: 'Comprando',     color: 'bg-emerald-500', dot: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  amarillo:      { label: 'Cap. limitada', color: 'bg-amber-400',  dot: 'text-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  rojo:          { label: 'No compra',     color: 'bg-red-500',    dot: 'text-red-500',     badge: 'bg-red-50 text-red-700 border-red-200' },
  sin_actividad: { label: 'Sin actividad', color: 'bg-gray-400',   dot: 'text-gray-400',    badge: 'bg-gray-50 text-gray-600 border-gray-200' },
};

export default function B05MisBodegas() {
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
  const navigate = useNavigate();

  useEffect(() => {
    api.bodeguero.misBodegas()
      .then((r: any) => setBodegas(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const barColor = (p: number) => p < 70 ? 'bg-[#1A5C38]' : p < 90 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="w-full">
      {/* Banner full-bleed */}
      <div className="w-full bg-gradient-to-br from-[#1A5C38] via-[#1e6b42] to-[#22733f] rounded-b-3xl shadow-[0_8px_30px_rgba(26,92,56,0.25)] relative overflow-hidden group/banner">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none transition-opacity duration-700 opacity-50 group-hover/banner:opacity-100" />
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 pt-4 pb-5 relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/banner:translate-x-1">
          <p className="text-[11px] font-bold text-green-300/80 uppercase tracking-widest mb-0.5 transition-colors duration-500 group-hover/banner:text-emerald-200">Módulo</p>
          <h1 className="text-[20px] sm:text-[24px] font-bold text-white leading-tight drop-shadow-sm">Mis Bodegas</h1>
          <p className="text-green-100/80 text-[13px] mt-0.5 leading-snug font-medium">
            {loading ? 'Cargando…' : `${bodegas.length} bodega${bodegas.length !== 1 ? 's' : ''} asociada${bodegas.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-6">

        {/* Toggle Lista / Mapa */}
        <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-4">
          <button
            onClick={() => setVista('lista')}
            className={`flex-1 py-2.5 text-[13px] font-medium flex items-center justify-center gap-2 transition-colors ${
              vista === 'lista' ? 'bg-[#1A5C38] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <List size={15} /> Lista
          </button>
          <button
            onClick={() => setVista('mapa')}
            className={`flex-1 py-2.5 text-[13px] font-medium flex items-center justify-center gap-2 transition-colors ${
              vista === 'mapa' ? 'bg-[#1A5C38] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapIcon size={15} /> Mapa
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#1A5C38]/30 border-t-[#1A5C38] rounded-full animate-spin" />
          </div>
        )}

        {/* ── Vista Lista ── */}
        {vista === 'lista' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {bodegas.map(b => {
            const sem = semaforoMap[b.semaforo_compra] || semaforoMap.sin_actividad;
            const pct = b.ocupacion_pct ?? 0;
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-5 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-black/[0.08] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[16px] text-gray-900 leading-tight">{b.nombre}</p>
                    <p className="text-[13px] text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">{b.municipio}, {b.estado}</span>
                    </p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${sem.badge}`}>
                    <Circle size={7} fill="currentColor" className={sem.dot} />
                    {sem.label}
                  </span>
                </div>

                {/* Barra ocupación */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                    <span className="font-medium">Ocupación {pct}%</span>
                    <span>{formatNum(b.stock_actual || 0)} / {formatNum(b.capacidad_ton || 0)} ton</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor(pct)} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => navigate(`/bodegas/${b.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#1A5C38]/[0.08] text-[#1A5C38] rounded-xl py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity"
                  >
                    Detalle <ChevronRight size={13} />
                  </button>
                  <button
                    onClick={() => navigate(`/bodegas/${b.id}/semaforo`)}
                    className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-[13px] font-semibold active:opacity-70 transition-opacity"
                  >
                    Semáforo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* ── Vista Mapa ── */}
        {vista === 'mapa' && !loading && (
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-500 hover:shadow-lg" style={{ height: 600 }}>
            <MapContainer
              center={[23.6345, -102.5528]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="© Esri"
              />
              {bodegas
                .filter(b => b.latitud && b.longitud && Math.abs(b.latitud!) > 0.001)
                .map(b => {
                  const sem = semaforoMap[b.semaforo_compra] || semaforoMap.sin_actividad;
                  return (
                    <Marker key={b.id} position={[b.latitud!, b.longitud!]} icon={greenDot}>
                      <Popup>
                        <div style={{ minWidth: 180 }}>
                          <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 3px' }}>{b.nombre}</p>
                          <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 6px' }}>
                            {b.municipio}, {b.estado}
                          </p>
                          <p style={{ fontSize: 11, color: '#374151', margin: '0 0 4px' }}>
                            Stock: {formatNum(b.stock_actual || 0)} / {formatNum(b.capacidad_ton || 0)} ton
                          </p>
                          <p style={{ fontSize: 11, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{
                              display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: b.semaforo_compra === 'verde' ? '#22c55e' : b.semaforo_compra === 'amarillo' ? '#f59e0b' : b.semaforo_compra === 'rojo' ? '#ef4444' : '#9ca3af'
                            }} />
                            {sem.label}
                          </p>
                          <button
                            onClick={() => navigate(`/bodegas/${b.id}`)}
                            style={{ width: '100%', background: '#1A5C38', color: 'white', fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 8 }}
                          >
                            Ver detalle
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          </div>
        )}

        {!loading && bodegas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Warehouse size={32} className="text-gray-300" />
            </div>
            <p className="font-semibold text-[16px] text-gray-700">Sin bodegas asociadas</p>
            <p className="text-[14px] text-gray-400">Toca + para agregar las bodegas que operas</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/bodegas/seleccionar')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#1A5C38] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform z-10"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
