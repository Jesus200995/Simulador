import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, SlidersHorizontal, X, ChevronDown,
  MapPin, Layers, RefreshCw,
} from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const HDR  = () => ({ Authorization: `Bearer ${localStorage.getItem('simac_token')}` });

const PALETA = [
  '#2563eb', '#16a34a', '#dc2626', '#9333ea',
  '#ea580c', '#0891b2', '#ca8a04', '#be185d',
  '#0d9488', '#7c3aed', '#b45309', '#065f46',
];

interface Parcela {
  up_id: number;
  up_name: string | null;
  state_name: string | null;
  municipality_name: string | null;
  area_ha_calc: number | null;
  created_at: string | null;
  geom_geojson: any;
  centroid_lat: number;
  centroid_lng: number;
  producer_id: number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  estado_validacion: string;
  ciclo_activo: string | null;
  cultivo_principal: string | null;
}

function parsePoly(geom: any): [number, number][] | null {
  if (!geom?.coordinates) return null;
  const ring: number[][] =
    geom.type === 'MultiPolygon' ? geom.coordinates[0]?.[0] : geom.coordinates[0];
  if (!ring || ring.length < 3) return null;
  return ring.map(([ln, la]: number[]) => [la, ln]);
}

function makeFlag(color: string) {
  return L.divIcon({
    html: `<div style="position:relative;width:20px;height:30px">
      <div style="position:absolute;left:3px;top:0;width:2px;height:28px;background:${color};border-radius:1px"></div>
      <div style="position:absolute;left:5px;top:1px;width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:12px solid ${color}"></div>
    </div>`,
    className: '',
    iconSize: [20, 30],
    iconAnchor: [3, 28],
    popupAnchor: [6, -28],
  });
}

function PopupContent({ p, nombre, color }: { p: Parcela; nombre: string; color: string }) {
  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', padding: '2px 0', minWidth: 210 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '18', border: `1.5px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: color }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 12.5, color: '#111827', lineHeight: 1.2 }}>{nombre}</div>
          <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 2 }}>{p.up_name || `Parcela #${p.up_id}`}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 14px' }}>
        <div>
          <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.05em', marginBottom: 2 }}>Superficie</div>
          <div style={{ color: '#111827', fontWeight: 800, fontSize: 14 }}>
            {p.area_ha_calc != null ? `${Number(p.area_ha_calc).toFixed(2)} ha` : '—'}
          </div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.05em', marginBottom: 2 }}>Cultivo</div>
          <div style={{ color: '#374151', fontWeight: 600, fontSize: 11.5 }}>{p.cultivo_principal || '—'}</div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.05em', marginBottom: 2 }}>Municipio</div>
          <div style={{ color: '#374151', fontWeight: 600, fontSize: 11.5 }}>{p.municipality_name || '—'}</div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.05em', marginBottom: 2 }}>Estado</div>
          <div style={{ color: '#374151', fontWeight: 600, fontSize: 11.5 }}>{p.state_name || '—'}</div>
        </div>
        {p.ciclo_activo && (
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.05em', marginBottom: 2 }}>Ciclo activo</div>
            <div style={{ color: '#374151', fontWeight: 600, fontSize: 11.5 }}>{p.ciclo_activo}</div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 9, paddingTop: 8, borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>
          {p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
        <span style={{
          fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          background: p.estado_validacion === 'activo' ? '#dcfce7' : p.estado_validacion === 'pendiente' ? '#fef9c3' : '#fee2e2',
          color: p.estado_validacion === 'activo' ? '#15803d' : p.estado_validacion === 'pendiente' ? '#a16207' : '#b91c1c',
        }}>
          {p.estado_validacion}
        </span>
      </div>
    </div>
  );
}

export default function ParcelasAdminPage() {
  const [parcelas, setParcelas]   = useState<Parcela[]>([]);
  const [loading, setLoading]     = useState(true);
  const [estados, setEstados]     = useState<string[]>([]);
  const [municipiosMapa, setMunicipiosMapa] = useState<{ state_name: string; municipality_name: string }[]>([]);

  const [filtroEstado,    setFiltroEstado]    = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroNombre,    setFiltroNombre]    = useState('');
  const [panelOpen,       setPanelOpen]       = useState(true);

  // Color por estado
  const colorPorEstado = useMemo(() => {
    const map = new Map<string, string>();
    [...new Set(parcelas.map(p => p.state_name || ''))].filter(Boolean)
      .forEach((e, i) => map.set(e, PALETA[i % PALETA.length]));
    return map;
  }, [parcelas]);

  // Parcelas filtradas
  const filtradas = useMemo(() => parcelas.filter(p => {
    if (filtroEstado    && p.state_name        !== filtroEstado)    return false;
    if (filtroMunicipio && p.municipality_name !== filtroMunicipio) return false;
    if (filtroNombre) {
      const q = filtroNombre.toLowerCase();
      const full = `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno || ''}`.toLowerCase();
      if (!full.includes(q)) return false;
    }
    return true;
  }), [parcelas, filtroEstado, filtroMunicipio, filtroNombre]);

  // Municipios disponibles para el estado seleccionado
  const municipiosDisponibles = useMemo(() => {
    const base = filtroEstado
      ? municipiosMapa.filter(m => m.state_name === filtroEstado)
      : municipiosMapa;
    return [...new Set(base.map(m => m.municipality_name))].sort();
  }, [filtroEstado, municipiosMapa]);

  const totalHa = useMemo(() =>
    filtradas.reduce((s, p) => s + (p.area_ha_calc || 0), 0), [filtradas]);

  const productoresUnicos = useMemo(() =>
    new Set(filtradas.map(p => p.producer_id)).size, [filtradas]);

  async function cargar() {
    setLoading(true);
    try {
      const [resP, resF] = await Promise.all([
        fetch(`${BASE}/admin/parcelas`, { headers: HDR() }),
        fetch(`${BASE}/admin/parcelas/filtros`, { headers: HDR() }),
      ]);
      if (resP.ok) { const d = await resP.json(); setParcelas(d.parcelas || []); }
      if (resF.ok) { const d = await resF.json(); setEstados(d.estados || []); setMunicipiosMapa(d.municipios || []); }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { cargar(); }, []);

  const hayFiltros = !!(filtroEstado || filtroMunicipio || filtroNombre);

  return (
    // -mx-3 -mb-3 cancela el padding del AdminShell para que el mapa sea edge-to-edge
    <div className="-mx-3 -mb-3 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── BARRA SUPERIOR ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-[15px] font-black text-gray-900 leading-none">Parcelas registradas</h2>
            {loading ? (
              <p className="text-[11px] text-gray-400 mt-0.5">Cargando datos...</p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-0.5">
                <span className="font-bold text-blue-600">{filtradas.length}</span> parcelas ·{' '}
                <span className="font-bold text-emerald-600">{totalHa.toLocaleString('es-MX', { maximumFractionDigits: 0 })} ha</span> ·{' '}
                <span className="font-bold text-purple-600">{productoresUnicos}</span> productores
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Búsqueda por productor */}
          <div className="relative hidden sm:block">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={filtroNombre}
              onChange={e => setFiltroNombre(e.target.value)}
              placeholder="Buscar productor…"
              className="pl-8 pr-8 py-1.5 text-[12px] border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white w-44 transition-all"
            />
            {filtroNombre && (
              <button onClick={() => setFiltroNombre('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Recargar */}
          <button
            onClick={cargar}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Toggle panel */}
          <button
            onClick={() => setPanelOpen(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all ${
              panelOpen ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filtros</span>
            {hayFiltros && (
              <span className="w-4 h-4 rounded-full bg-white text-blue-700 text-[9px] font-black flex items-center justify-center">
                {[filtroEstado, filtroMunicipio, filtroNombre].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── CUERPO: PANEL + MAPA ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Panel lateral de filtros */}
        {panelOpen && (
          <div className="w-[264px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto shadow-lg shadow-gray-100 z-10">
            <div className="p-4 space-y-5">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-center">
                  <div className="text-[17px] font-black text-blue-700 leading-none">{filtradas.length}</div>
                  <div className="text-[8.5px] font-bold text-blue-500 uppercase tracking-wide mt-1">Parcelas</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center">
                  <div className="text-[17px] font-black text-emerald-700 leading-none">{totalHa.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
                  <div className="text-[8.5px] font-bold text-emerald-500 uppercase tracking-wide mt-1">Hectáreas</div>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5 text-center">
                  <div className="text-[17px] font-black text-purple-700 leading-none">{productoresUnicos}</div>
                  <div className="text-[8.5px] font-bold text-purple-500 uppercase tracking-wide mt-1">Product.</div>
                </div>
              </div>

              {/* Filtros */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtrar por</p>

                {/* Estado */}
                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Estado</label>
                  <div className="relative">
                    <select
                      value={filtroEstado}
                      onChange={e => { setFiltroEstado(e.target.value); setFiltroMunicipio(''); }}
                      className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white appearance-none pr-8 transition-all"
                    >
                      <option value="">Todos los estados</option>
                      {estados.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Municipio */}
                <div>
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Municipio</label>
                  <div className="relative">
                    <select
                      value={filtroMunicipio}
                      onChange={e => setFiltroMunicipio(e.target.value)}
                      className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white appearance-none pr-8 transition-all"
                    >
                      <option value="">Todos los municipios</option>
                      {municipiosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Búsqueda en panel (mobile visible aquí) */}
                <div className="sm:hidden">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Productor</label>
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={filtroNombre}
                      onChange={e => setFiltroNombre(e.target.value)}
                      placeholder="Nombre o apellido…"
                      className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Limpiar filtros */}
              {hayFiltros && (
                <button
                  onClick={() => { setFiltroEstado(''); setFiltroMunicipio(''); setFiltroNombre(''); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-[11.5px] font-bold text-red-600 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <X size={12} /> Limpiar filtros
                </button>
              )}

              {/* Leyenda de colores por estado */}
              {colorPorEstado.size > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Leyenda por estado</p>
                  <div className="space-y-2">
                    {[...colorPorEstado.entries()].map(([estado, color]) => {
                      const count = filtradas.filter(p => p.state_name === estado).length;
                      const ha    = filtradas.filter(p => p.state_name === estado).reduce((s, p) => s + (p.area_ha_calc || 0), 0);
                      return (
                        <button
                          key={estado}
                          onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left ${
                            filtroEstado === estado ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11.5px] font-bold text-gray-800 truncate">{estado}</div>
                            <div className="text-[9.5px] text-gray-400">{ha.toFixed(0)} ha</div>
                          </div>
                          <span className="text-[10px] font-black text-gray-500 flex-shrink-0">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MAPA ── */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-gray-900/30 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3">
                <RefreshCw size={18} className="text-blue-600 animate-spin" />
                <p className="text-[13px] font-bold text-gray-700">Cargando parcelas…</p>
              </div>
            </div>
          )}

          {!loading && filtradas.length === 0 && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl px-6 py-5 text-center">
                <MapPin size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-gray-600">Sin parcelas para los filtros aplicados</p>
                {hayFiltros && <p className="text-[11px] text-gray-400 mt-1">Intenta cambiar los filtros</p>}
              </div>
            </div>
          )}

          <MapContainer
            center={[24.8083, -107.3941]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            zoomControl
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="ESRI"
            />
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution=""
              opacity={0.65}
            />

            {/* Polígonos */}
            {filtradas.map(p => {
              const pos   = parsePoly(p.geom_geojson);
              const color = colorPorEstado.get(p.state_name || '') || '#2563eb';
              const nombre = [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
              if (!pos) return null;
              return (
                <Polygon
                  key={`poly-${p.up_id}`}
                  positions={pos}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.28, weight: 2, opacity: 0.85 }}
                >
                  <Popup minWidth={220} maxWidth={290}>
                    <PopupContent p={p} nombre={nombre} color={color} />
                  </Popup>
                </Polygon>
              );
            })}

            {/* Banderitas */}
            {filtradas.map(p => {
              if (!parsePoly(p.geom_geojson)) return null;
              const color  = colorPorEstado.get(p.state_name || '') || '#2563eb';
              const nombre = [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
              return (
                <Marker
                  key={`flag-${p.up_id}`}
                  position={[p.centroid_lat, p.centroid_lng]}
                  icon={makeFlag(color)}
                >
                  <Popup minWidth={220} maxWidth={290}>
                    <PopupContent p={p} nombre={nombre} color={color} />
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
