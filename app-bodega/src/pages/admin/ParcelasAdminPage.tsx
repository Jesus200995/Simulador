import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search, SlidersHorizontal, X, ChevronDown, MapPin, Layers, RefreshCw,
  Map, List, Trash2, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const LEAFLET_TEXT_SELECT_STYLE = `
  .leaflet-popup-content { user-select: text !important; -webkit-user-select: text !important; cursor: auto !important; }
  .leaflet-popup-content * { user-select: text !important; -webkit-user-select: text !important; }
  .leaflet-container { cursor: crosshair; }
`;

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
  curp: string | null;
  correo: string | null;
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="26" viewBox="0 0 22 26" style="overflow:visible;display:block">
    <line x1="5" y1="0" x2="5" y2="22" stroke="white" stroke-width="5" stroke-linecap="round"/>
    <polygon points="5,0 20,6 5,12" fill="white" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="5" cy="22" r="5.5" fill="white"/>
    <line x1="5" y1="0" x2="5" y2="22" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    <polygon points="5,0 19,6 5,12" fill="${color}"/>
    <circle cx="5" cy="22" r="3.5" fill="${color}"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [22, 26], iconAnchor: [5, 26], popupAnchor: [2, -28] });
}

function FlyToController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 15, { animate: true, duration: 1.0 });
  }, [target]);
  return null;
}

function fmtHa(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('es-MX', { maximumFractionDigits: 0 });
}

function PopupContent({ p, nombre, color }: { p: Parcela; nombre: string; color: string }) {
  const ha = p.area_ha_calc != null ? parseFloat(String(p.area_ha_calc)) : null;
  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', padding: '2px 0', minWidth: 230, userSelect: 'text', WebkitUserSelect: 'text' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '18', border: `1.5px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#111827', lineHeight: 1.25, marginBottom: 3 }}>{nombre}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px' }}>
            {p.curp && (
              <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: '#6b7280', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '1px 5px' }}>
                {p.curp}
              </span>
            )}
            <span style={{ fontSize: 9.5, fontFamily: 'monospace', color, background: color + '12', border: `1px solid ${color}30`, borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>
              UP-{p.up_id}
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 4 }}>{p.up_name || 'Sin nombre'}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        <div>
          <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.06em', marginBottom: 2 }}>Superficie</div>
          <div style={{ color: '#111827', fontWeight: 800, fontSize: 15 }}>{ha != null ? `${ha.toFixed(2)} ha` : '—'}</div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.06em', marginBottom: 2 }}>Cultivo</div>
          <div style={{ color: '#374151', fontWeight: 600, fontSize: 12 }}>{p.cultivo_principal || '—'}</div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.06em', marginBottom: 2 }}>Municipio</div>
          <div style={{ color: '#374151', fontWeight: 600, fontSize: 12 }}>{p.municipality_name || '—'}</div>
        </div>
        <div>
          <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.06em', marginBottom: 2 }}>Estado</div>
          <div style={{ color: '#374151', fontWeight: 600, fontSize: 12 }}>{p.state_name || '—'}</div>
        </div>
        {p.ciclo_activo && (
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.06em', marginBottom: 2 }}>Ciclo activo</div>
            <div style={{ color: '#374151', fontWeight: 600, fontSize: 12 }}>{p.ciclo_activo}</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>
          {p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
        <span style={{
          fontSize: 9, padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          background: p.estado_validacion === 'activo' ? '#dcfce7' : p.estado_validacion === 'pendiente' ? '#fef9c3' : '#fee2e2',
          color:      p.estado_validacion === 'activo' ? '#15803d' : p.estado_validacion === 'pendiente' ? '#a16207' : '#b91c1c',
        }}>
          {p.estado_validacion}
        </span>
      </div>
    </div>
  );
}

/* ── Modal de confirmación de eliminación ── */
function ModalEliminar({ parcela, onConfirm, onCancel, loading }: {
  parcela: Parcela;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const nombre = [parcela.nombres, parcela.apellido_paterno, parcela.apellido_materno].filter(Boolean).join(' ');
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-[15px] font-black text-gray-900">Eliminar parcela</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3.5 mb-5 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase w-16 flex-shrink-0">Parcela</span>
            <span className="text-[12px] font-bold text-gray-800">{parcela.up_name || `UP-${parcela.up_id}`}</span>
            <span className="text-[9px] font-mono text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 ml-auto">UP-{parcela.up_id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase w-16 flex-shrink-0">Productor</span>
            <span className="text-[12px] text-gray-700">{nombre}</span>
          </div>
          {parcela.state_name && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase w-16 flex-shrink-0">Estado</span>
              <span className="text-[12px] text-gray-700">{parcela.state_name}</span>
            </div>
          )}
        </div>
        <p className="text-[12px] text-gray-500 mb-5">
          Se eliminarán también los ciclos y disponibilidades asociados a esta parcela. El productor no será eliminado.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-[13px] font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Toast ── */
function Toast({ msg, tipo }: { msg: string; tipo: 'ok' | 'err' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-[13px] font-bold text-white ${tipo === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {tipo === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      {msg}
    </div>
  );
}

export default function ParcelasAdminPage() {
  const [parcelas, setParcelas]     = useState<Parcela[]>([]);
  const [loading, setLoading]       = useState(true);
  const [estados, setEstados]       = useState<string[]>([]);
  const [municipiosMapa, setMunicipiosMapa] = useState<{ state_name: string; municipality_name: string }[]>([]);

  // Filtros mapa
  const [filtroEstado,    setFiltroEstado]    = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroNombre,    setFiltroNombre]    = useState('');
  const [panelOpen,       setPanelOpen]       = useState(true);
  const [flyTarget,       setFlyTarget]       = useState<[number, number] | null>(null);

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'mapa' | 'lista'>('mapa');

  // Filtro lista
  const [filtroLista, setFiltroLista] = useState('');

  // Eliminar
  const [parcelaAEliminar, setParcelaAEliminar] = useState<Parcela | null>(null);
  const [eliminando, setEliminando]             = useState(false);
  const [toast, setToast]                       = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string, tipo: 'ok' | 'err') {
    setToast({ msg, tipo });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  const colorPorEstado = useMemo(() => {
    const map = new Map<string, string>();
    [...new Set(parcelas.map(p => p.state_name || ''))].filter(Boolean)
      .forEach((e, i) => map.set(e, PALETA[i % PALETA.length]));
    return map;
  }, [parcelas]);

  const filtradas = useMemo(() => parcelas.filter(p => {
    if (filtroEstado    && p.state_name        !== filtroEstado)    return false;
    if (filtroMunicipio && p.municipality_name !== filtroMunicipio) return false;
    if (filtroNombre) {
      const q    = filtroNombre.toLowerCase();
      const full = `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno || ''}`.toLowerCase();
      if (!full.includes(q)) return false;
    }
    return true;
  }), [parcelas, filtroEstado, filtroMunicipio, filtroNombre]);

  const filtradasLista = useMemo(() => {
    if (!filtroLista.trim()) return parcelas;
    const q = filtroLista.toLowerCase();
    return parcelas.filter(p => {
      const nombre = `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno || ''}`.toLowerCase();
      return (
        nombre.includes(q) ||
        (p.curp?.toLowerCase().includes(q)) ||
        (p.correo?.toLowerCase().includes(q)) ||
        String(p.up_id).includes(q) ||
        (p.up_name?.toLowerCase().includes(q))
      );
    });
  }, [parcelas, filtroLista]);

  const municipiosDisponibles = useMemo(() => {
    const base = filtroEstado
      ? municipiosMapa.filter(m => m.state_name === filtroEstado)
      : municipiosMapa;
    return [...new Set(base.map(m => m.municipality_name))].sort();
  }, [filtroEstado, municipiosMapa]);

  const totalHa = useMemo(() =>
    filtradas.reduce((s, p) => s + (parseFloat(String(p.area_ha_calc ?? 0)) || 0), 0),
  [filtradas]);

  const productoresUnicos = useMemo(() =>
    new Set(filtradas.map(p => p.producer_id)).size,
  [filtradas]);

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

  async function eliminarParcela() {
    if (!parcelaAEliminar) return;
    setEliminando(true);
    try {
      const res = await fetch(`${BASE}/admin/parcelas/${parcelaAEliminar.up_id}`, {
        method: 'DELETE',
        headers: HDR(),
      });
      const data = await res.json();
      if (res.ok) {
        setParcelas(prev => prev.filter(p => p.up_id !== parcelaAEliminar.up_id));
        showToast(data.message || 'Parcela eliminada', 'ok');
      } else {
        showToast(data.error || 'Error al eliminar', 'err');
      }
    } catch {
      showToast('Error de conexión', 'err');
    }
    setEliminando(false);
    setParcelaAEliminar(null);
  }

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'leaflet-text-select';
    el.textContent = LEAFLET_TEXT_SELECT_STYLE;
    document.head.appendChild(el);
    return () => { document.getElementById('leaflet-text-select')?.remove(); };
  }, []);

  const hayFiltros = !!(filtroEstado || filtroMunicipio || filtroNombre);

  return (
    <div className="-mx-3 -mb-3 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── BARRA SUPERIOR ── */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
            <Layers size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[14px] sm:text-[15px] font-black text-gray-900 leading-none truncate">Parcelas registradas</h2>
            {loading ? (
              <p className="text-[11px] text-gray-400 mt-0.5">Cargando datos…</p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-0.5">
                <span className="font-bold text-blue-600">{filtradas.length.toLocaleString('es-MX')}</span> parcelas ·{' '}
                <span className="font-bold text-emerald-600">{fmtHa(totalHa)} ha</span> ·{' '}
                <span className="font-bold text-purple-600">{productoresUnicos}</span> productores
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Pestañas */}
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
            <button
              onClick={() => setActiveTab('mapa')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold transition-all ${
                activeTab === 'mapa'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Map size={13} /> <span className="hidden sm:inline">Mapa</span>
            </button>
            <button
              onClick={() => setActiveTab('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold transition-all ${
                activeTab === 'lista'
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={13} /> <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            onClick={cargar} disabled={loading}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>

          {activeTab === 'mapa' && (
            <button
              onClick={() => setPanelOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all ${
                panelOpen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
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
          )}
        </div>
      </div>

      {/* ── CUERPO ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══ PESTAÑA MAPA ══ */}
        {activeTab === 'mapa' && (
          <>
            {/* Panel lateral */}
            {panelOpen && (
              <div className="w-[252px] flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden shadow-lg shadow-gray-100/80 z-10">

                {/* Filtros (altura fija) */}
                <div className="p-3.5 space-y-2.5 flex-shrink-0 border-b border-gray-100">
                  <p className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest">Filtrar por</p>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Estado</label>
                    <div className="relative">
                      <select
                        value={filtroEstado}
                        onChange={e => { setFiltroEstado(e.target.value); setFiltroMunicipio(''); }}
                        className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white appearance-none pr-8 transition-all"
                      >
                        <option value="">Todos los estados</option>
                        {estados.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Municipio</label>
                    <div className="relative">
                      <select
                        value={filtroMunicipio}
                        onChange={e => setFiltroMunicipio(e.target.value)}
                        className="w-full text-[12px] border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white appearance-none pr-8 transition-all"
                      >
                        <option value="">Todos los municipios</option>
                        {municipiosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:hidden">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-1">Productor</label>
                    <div className="relative">
                      <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={filtroNombre}
                        onChange={e => setFiltroNombre(e.target.value)}
                        placeholder="Nombre o apellido…"
                        className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white"
                      />
                    </div>
                  </div>

                  {hayFiltros && (
                    <button
                      onClick={() => { setFiltroEstado(''); setFiltroMunicipio(''); setFiltroNombre(''); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <X size={11} /> Limpiar filtros
                    </button>
                  )}
                </div>

                {/* Leyenda con scroll */}
                {colorPorEstado.size > 0 && (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-3.5 pt-3 pb-1.5 flex-shrink-0">
                      <p className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest">Leyenda por estado</p>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3.5 pb-3.5 space-y-1">
                      {[...colorPorEstado.entries()].map(([estado, color]) => {
                        const count = filtradas.filter(p => p.state_name === estado).length;
                        const ha    = filtradas.filter(p => p.state_name === estado)
                          .reduce((s, p) => s + (parseFloat(String(p.area_ha_calc ?? 0)) || 0), 0);
                        const activo = filtroEstado === estado;
                        return (
                          <button
                            key={estado}
                            onClick={() => setFiltroEstado(activo ? '' : estado)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all text-left ${
                              activo ? 'border-blue-300 bg-blue-50' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <svg width="14" height="17" viewBox="0 0 22 26" style={{ flexShrink: 0, overflow: 'visible' }}>
                              <line x1="5" y1="0" x2="5" y2="22" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                              <polygon points="5,0 20,6 5,12" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                              <circle cx="5" cy="22" r="5" fill="white"/>
                              <line x1="5" y1="0" x2="5" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
                              <polygon points="5,0 19,6 5,12" fill={color}/>
                              <circle cx="5" cy="22" r="3.5" fill={color}/>
                            </svg>
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-bold text-gray-800 truncate">{estado}</div>
                              <div className="text-[9.5px] text-gray-400">{fmtHa(ha)} ha</div>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 flex-shrink-0 tabular-nums">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mapa */}
            <div className="flex-1 relative">
              {loading && (
                <div className="absolute inset-0 z-[999] flex items-center justify-center bg-gray-900/20 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-3">
                    <RefreshCw size={18} className="text-blue-600 animate-spin" />
                    <p className="text-[13px] font-bold text-gray-700">Cargando parcelas…</p>
                  </div>
                </div>
              )}
              {!loading && filtradas.length === 0 && (
                <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl px-7 py-6 text-center">
                    <MapPin size={28} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-[13px] font-bold text-gray-600">Sin parcelas para los filtros aplicados</p>
                    {hayFiltros && <p className="text-[11px] text-gray-400 mt-1">Intenta cambiar los filtros</p>}
                  </div>
                </div>
              )}
              <MapContainer center={[24.8083, -107.3941]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl>
                <FlyToController target={flyTarget} />
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="ESRI" />
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" attribution="" opacity={0.65} />
                {filtradas.map(p => {
                  const pos   = parsePoly(p.geom_geojson);
                  const color = colorPorEstado.get(p.state_name || '') || '#2563eb';
                  if (!pos) return null;
                  return (
                    <Polygon
                      key={`poly-${p.up_id}`}
                      positions={pos}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.28, weight: 2, opacity: 0.9 }}
                      eventHandlers={{ click: () => setFlyTarget([p.centroid_lat, p.centroid_lng]) }}
                    />
                  );
                })}
                {filtradas.map(p => {
                  if (!parsePoly(p.geom_geojson)) return null;
                  const color  = colorPorEstado.get(p.state_name || '') || '#2563eb';
                  const nombre = [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
                  return (
                    <Marker
                      key={`flag-${p.up_id}`}
                      position={[p.centroid_lat, p.centroid_lng]}
                      icon={makeFlag(color)}
                      eventHandlers={{ click: () => setFlyTarget([p.centroid_lat, p.centroid_lng]) }}
                    >
                      <Popup minWidth={230} maxWidth={300}>
                        <PopupContent p={p} nombre={nombre} color={color} />
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </>
        )}

        {/* ══ PESTAÑA LISTA ══ */}
        {activeTab === 'lista' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">

            {/* Barra de búsqueda lista */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
              <div className="max-w-xl relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  value={filtroLista}
                  onChange={e => setFiltroLista(e.target.value)}
                  placeholder="Buscar por nombre, CURP, correo o ID de parcela…"
                  className="w-full pl-9 pr-9 py-2.5 text-[13px] border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
                {filtroLista && (
                  <button onClick={() => setFiltroLista('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    <X size={13} />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {loading ? 'Cargando…' : `${filtradasLista.length.toLocaleString('es-MX')} parcelas encontradas`}
              </p>
            </div>

            {/* Tabla */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full gap-3 text-gray-400">
                  <RefreshCw size={18} className="animate-spin" />
                  <span className="text-[13px] font-bold">Cargando parcelas…</span>
                </div>
              ) : filtradasLista.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  <MapPin size={32} className="text-gray-300" />
                  <p className="text-[13px] font-bold text-gray-500">Sin resultados</p>
                  {filtroLista && <p className="text-[11px] text-gray-400">Intenta con otra búsqueda</p>}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-200 sticky top-0 z-10">
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider w-20">ID</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Parcela</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">Productor</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider hidden md:table-cell">CURP</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider hidden lg:table-cell">Correo</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider hidden sm:table-cell">Estado / Municipio</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider hidden sm:table-cell text-right">Ha</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider w-14"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtradasLista.map(p => {
                      const nombre = [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
                      const color  = colorPorEstado.get(p.state_name || '') || '#2563eb';
                      const ha     = p.area_ha_calc != null ? parseFloat(String(p.area_ha_calc)) : null;
                      return (
                        <tr key={p.up_id} className="bg-white hover:bg-blue-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border" style={{ color, background: color + '12', borderColor: color + '30' }}>
                              UP-{p.up_id}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[12px] font-bold text-gray-800 leading-tight">{p.up_name || '—'}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{p.ciclo_activo || p.cultivo_principal || '—'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[12px] font-semibold text-gray-800 leading-tight">{nombre}</div>
                            <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                              p.estado_validacion === 'activo' ? 'bg-emerald-50 text-emerald-700' :
                              p.estado_validacion === 'pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {p.estado_validacion}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-[10px] font-mono text-gray-500">{p.curp || '—'}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-[11px] text-gray-500">{p.correo || '—'}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="text-[11px] font-semibold text-gray-700">{p.state_name || '—'}</div>
                            <div className="text-[10px] text-gray-400">{p.municipality_name || ''}</div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-right">
                            <span className="text-[12px] font-bold text-gray-700 tabular-nums">
                              {ha != null ? ha.toFixed(1) : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setParcelaAEliminar(p)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                              title="Eliminar parcela"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal eliminar */}
      {parcelaAEliminar && (
        <ModalEliminar
          parcela={parcelaAEliminar}
          onConfirm={eliminarParcela}
          onCancel={() => setParcelaAEliminar(null)}
          loading={eliminando}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} tipo={toast.tipo} />}
    </div>
  );
}
