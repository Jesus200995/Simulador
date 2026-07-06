import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Search, Eye, ShieldAlert, RefreshCw, Warehouse, BarChart3, X, CheckCircle,
  Weight, Package, Percent, FileText, LayoutGrid, MapPin, Edit3,
  Phone, Calendar, Building2, Save, Loader2, Table2, Navigation2
} from 'lucide-react';

mapboxgl.accessToken = [
  'pk.eyJ1IjoibWFyaWVsMDgi',
  'LCJhIjoiY202emV3MDhhMDN6Y',
  'jJscHVqaXExdGpjMyJ9.F_ACoKzS_4e280lD0XndEw',
].join('');

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
  localidad?: string;
  direccion?: string;
  latitud: number;
  longitud: number;
  estatus: 'aprobada' | 'pendiente' | 'rechazada';
  semaforo_compra: 'sin_actividad' | 'verde' | 'amarillo' | 'rojo';
  stock_actual?: number;
  clave?: string;
  region_nombre?: string;
  created_at?: string;
  fecha_creacion?: string;
}

const ESTATUS_CFG = {
  aprobada:  { label: 'Aprobada',  color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  pendiente: { label: 'Pendiente', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  rechazada: { label: 'Rechazada', color: 'text-red-600 bg-red-50 border-red-200' },
};
const SEM_CFG = {
  verde:        { label: 'Comprando',    dot: 'bg-emerald-500' },
  amarillo:     { label: 'Limitado',     dot: 'bg-amber-400' },
  rojo:         { label: 'No compra',    dot: 'bg-red-500' },
  sin_actividad:{ label: 'Sin actividad',dot: 'bg-gray-300' },
};

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)); }
  catch { return d; }
}

export default function BodegasAdminPage() {
  const navigate = useNavigate();

  const [bodegas, setBodegas]   = useState<Bodega[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'bodegas' | 'lista' | 'estadisticas' | 'pendientes'>('bodegas');
  const [stats, setStats]       = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filtros
  const [search, setSearch]         = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');

  // Mapa
  const mapContainer   = useRef<HTMLDivElement>(null);
  const map            = useRef<mapboxgl.Map | null>(null);
  const mapReady       = useRef(false);
  const mapInitialized = useRef(false);
  const popupRef       = useRef<mapboxgl.Popup | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Modal detalle
  const [detalleTarget, setDetalleTarget] = useState<Bodega | null>(null);
  const [detalleData, setDetalleData]     = useState<any>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  // Modal editar
  const [editTarget, setEditTarget]   = useState<Bodega | null>(null);
  const [editForm, setEditForm]       = useState<Partial<Bodega>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState('');

  // Modal aprobar/rechazar
  const [modalAccion, setModalAccion] = useState<{ tipo: 'aprobar' | 'rechazar'; bodega: Bodega } | null>(null);
  const [accionLoading, setAccionLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  /* ─── CARGA ─── */
  async function cargarBodegas() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/bodegas`, { headers: HDR() });
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      const lista = (data.bodegas || data).map((b: any) => ({
        id: b.id || b.bodega_id,
        nombre: b.nombre || 'Sin nombre',
        encargado_nombre: b.encargado_nombre || b.nombre_encargado || '',
        telefono: b.telefono || '',
        capacidad_total: parseFloat(b.capacidad_ton || b.capacidad_total || '0'),
        estado: b.estado || '',
        municipio: b.municipio || '',
        localidad: b.localidad || '',
        direccion: b.direccion || '',
        latitud: parseFloat(b.latitud || b.lat || '23.6'),
        longitud: parseFloat(b.longitud || b.lng || '-102.5'),
        estatus: b.estatus || 'aprobada',
        semaforo_compra: b.semaforo_compra || 'sin_actividad',
        stock_actual: parseFloat(b.stock_actual || '0'),
        clave: b.clave || '',
        region_nombre: b.region_nombre || '',
        created_at: b.created_at || b.fecha_creacion,
      }));

      // Mezclar pendientes
      try {
        const rp = await fetch(`${BASE}/admin/bodegas-pendientes`, { headers: HDR() });
        if (rp.ok) {
          const pend = await rp.json();
          const pendList = (pend.bodegas || pend || []).map((b: any) => ({
            id: b.id || b.bodega_id, nombre: b.nombre || 'Bodega Pendiente',
            encargado_nombre: b.encargado_nombre || '', telefono: b.telefono || '',
            capacidad_total: parseFloat(b.capacidad_ton || b.capacidad_total || '0'),
            estado: b.estado || '', municipio: b.municipio || '',
            latitud: parseFloat(b.latitud || '20.3'), longitud: parseFloat(b.longitud || '-102.7'),
            estatus: 'pendiente' as const, semaforo_compra: 'amarillo' as const, stock_actual: 0,
          }));
          const merged = [...lista];
          pendList.forEach((p: any) => { if (!merged.find(m => m.id === p.id)) merged.push(p); });
          setBodegas(merged);
        } else setBodegas(lista);
      } catch { setBodegas(lista); }
    } catch (e) {
      console.error(e);
      setBodegas([]);
    } finally {
      setLoading(false);
    }
  }

  async function cargarStats() {
    setStatsLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/bodegas/estadisticas`, { headers: HDR() });
      const data = r.ok ? await r.json() : null;
      if (data) { setStats(data); return; }
    } catch {}
    const cap = bodegas.reduce((s, b) => s + b.capacidad_total, 0);
    const stk = bodegas.reduce((s, b) => s + (b.stock_actual || 0), 0);
    setStats({ capacidad_total: cap, stock_total: stk,
      pct_ocupacion: cap > 0 ? ((stk / cap) * 100).toFixed(1) : 0,
      con_tarifario: bodegas.filter(b => b.estatus === 'aprobada').length,
      ventanillas_activas: bodegas.filter(b => b.estatus === 'aprobada').length });
    setStatsLoading(false);
  }

  useEffect(() => { cargarBodegas(); }, []);
  useEffect(() => { if (tab === 'estadisticas' && !stats) cargarStats(); }, [tab]);

  /* ─── FILTRADO ─── */
  const filteredList = bodegas.filter(b => {
    if (search && !b.nombre.toLowerCase().includes(search.toLowerCase()) &&
        !b.municipio.toLowerCase().includes(search.toLowerCase())) return false;
    if (estadoFilter && b.estado !== estadoFilter) return false;
    if (estatusFilter && b.estatus !== estatusFilter) return false;
    return true;
  });

  /* ─── MAPBOX INIT ─── */
  function buildGeoJSON(list: Bodega[]) {
    return {
      type: 'FeatureCollection' as const,
      features: list.map(b => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [b.longitud, b.latitud] },
        properties: { id: b.id, nombre: b.nombre, municipio: b.municipio,
          estado: b.estado, estatus: b.estatus, semaforo: b.semaforo_compra,
          capacidad: b.capacidad_total, encargado: b.encargado_nombre },
      })),
    };
  }

  const initMap = useCallback(() => {
    if (mapInitialized.current || !mapContainer.current) return;
    mapInitialized.current = true;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-102.5528, 23.6345],
      zoom: 5,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    map.current.on('load', () => {
      mapReady.current = true;
      map.current!.addSource('bodegas', { type: 'geojson', data: buildGeoJSON(bodegas) });

      // Halo de selección
      map.current!.addLayer({
        id: 'bodegas-halo',
        type: 'circle',
        source: 'bodegas',
        filter: ['==', ['get', 'id'], -1],
        paint: {
          'circle-radius': 22,
          'circle-color': '#1A5C38',
          'circle-opacity': 0.18,
          'circle-stroke-width': 0,
        },
      });

      // Círculos principales
      map.current!.addLayer({
        id: 'bodegas-circles',
        type: 'circle',
        source: 'bodegas',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 7, 10, 11, 14, 14],
          'circle-color': ['case',
            ['==', ['get', 'estatus'], 'aprobada'],  '#10B981',
            ['==', ['get', 'estatus'], 'pendiente'], '#f59e0b',
            '#9CA3AF',
          ],
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 4, 1.5, 10, 2.5],
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.95,
        },
      });

      // Punto central de selección
      map.current!.addLayer({
        id: 'bodegas-selected',
        type: 'circle',
        source: 'bodegas',
        filter: ['==', ['get', 'id'], -1],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 9, 10, 14, 14, 17],
          'circle-color': '#1A5C38',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1,
        },
      });

      // Cursor
      map.current!.on('mouseenter', 'bodegas-circles', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'bodegas-circles', () => {
        map.current!.getCanvas().style.cursor = '';
      });

      // Click en marker
      map.current!.on('click', 'bodegas-circles', (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const p = feat.properties as any;
        const coords = (feat.geometry as any).coordinates as [number, number];

        setSelectedId(p.id);
        map.current!.setFilter('bodegas-selected', ['==', ['get', 'id'], p.id]);
        map.current!.setFilter('bodegas-halo',     ['==', ['get', 'id'], p.id]);
        map.current!.flyTo({ center: coords, zoom: Math.max(map.current!.getZoom(), 11), duration: 900 });

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '260px', offset: 16 })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:system-ui,-apple-system,sans-serif;padding:4px 2px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${
                  p.estatus === 'aprobada' ? '#10B981' : p.estatus === 'pendiente' ? '#f59e0b' : '#9CA3AF'
                };flex-shrink:0;display:inline-block;"></span>
                <span style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:${
                  p.estatus === 'aprobada' ? '#065f46' : p.estatus === 'pendiente' ? '#92400e' : '#374151'
                };">${p.estatus}</span>
              </div>
              <h4 style="font-size:13px;font-weight:800;color:#111827;margin:0 0 3px;line-height:1.3;">${p.nombre}</h4>
              <p style="font-size:11px;color:#6B7280;margin:0 0 8px;">📍 ${p.municipio}, ${p.estado}</p>
              <div style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:10px;padding:8px 10px;font-size:11px;color:#374151;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                  <span style="color:#9CA3AF;">Capacidad</span>
                  <strong>${Number(p.capacidad||0).toLocaleString()} t</strong>
                </div>
                ${p.encargado ? `<div style="display:flex;justify-content:space-between;">
                  <span style="color:#9CA3AF;">Encargado</span>
                  <strong style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.encargado}</strong>
                </div>` : ''}
              </div>
              <button onclick="window.__bodegaNav(${p.id})"
                style="width:100%;background:#1A5C38;color:#fff;border:none;border-radius:12px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.01em;">
                Ver ficha completa →
              </button>
            </div>
          `)
          .addTo(map.current!);
      });

      // Click en mapa vacío
      map.current!.on('click', (e) => {
        const feats = map.current!.queryRenderedFeatures(e.point, { layers: ['bodegas-circles'] });
        if (!feats.length) {
          setSelectedId(null);
          map.current!.setFilter('bodegas-selected', ['==', ['get', 'id'], -1]);
          map.current!.setFilter('bodegas-halo',     ['==', ['get', 'id'], -1]);
        }
      });
    });
  }, [bodegas]);

  // Exponer navigate para el popup HTML
  useEffect(() => {
    (window as any).__bodegaNav = (id: number) => navigate(`/admin/bodegas/${id}`);
    return () => { delete (window as any).__bodegaNav; };
  }, [navigate]);

  // Inicializar mapa cuando se va a la pestaña lista
  useEffect(() => {
    if (tab === 'lista') {
      setTimeout(() => initMap(), 50);
    }
  }, [tab, initMap]);

  // Actualizar GeoJSON cuando cambia la lista filtrada
  useEffect(() => {
    if (!mapReady.current || !map.current) return;
    const src = map.current.getSource('bodegas') as mapboxgl.GeoJSONSource | undefined;
    src?.setData(buildGeoJSON(filteredList));
  }, [filteredList]);

  function focusBodega(b: Bodega) {
    setSelectedId(b.id);
    if (map.current && mapReady.current) {
      map.current.setFilter('bodegas-selected', ['==', ['get', 'id'], b.id]);
      map.current.setFilter('bodegas-halo',     ['==', ['get', 'id'], b.id]);
      map.current.flyTo({ center: [b.longitud, b.latitud], zoom: 12, duration: 1200 });
    }
  }

  /* ─── DETALLE ─── */
  async function abrirDetalle(b: Bodega) {
    setDetalleTarget(b);
    setDetalleData(null);
    setDetalleLoading(true);
    try {
      const r = await fetch(`${BASE}/bodegas/${b.id}`, { headers: HDR() });
      if (r.ok) { const d = await r.json(); setDetalleData(d.bodega || d); }
    } catch {}
    setDetalleLoading(false);
  }

  /* ─── EDITAR ─── */
  function abrirEditar(b: Bodega) {
    setEditTarget(b);
    setEditForm({
      nombre: b.nombre, estado: b.estado, municipio: b.municipio,
      localidad: b.localidad || '', direccion: b.direccion || '',
      telefono: b.telefono, capacidad_total: b.capacidad_total, estatus: b.estatus,
    });
    setEditError('');
  }

  async function guardarEdicion() {
    if (!editTarget) return;
    setEditLoading(true); setEditError('');
    try {
      const body = {
        nombre: editForm.nombre, estado: editForm.estado, municipio: editForm.municipio,
        localidad: editForm.localidad, direccion: editForm.direccion, telefono: editForm.telefono,
        capacidad_ton: editForm.capacidad_total, estatus: editForm.estatus,
      };
      const r = await fetch(`${BASE}/admin/bodegas/${editTarget.id}`, {
        method: 'PATCH', headers: { ...HDR(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
      setBodegas(prev => prev.map(b => b.id === editTarget.id ? {
        ...b, nombre: editForm.nombre || b.nombre, estado: editForm.estado || b.estado,
        municipio: editForm.municipio || b.municipio, localidad: editForm.localidad,
        direccion: editForm.direccion, telefono: editForm.telefono || b.telefono,
        capacidad_total: Number(editForm.capacidad_total) || b.capacidad_total,
        estatus: (editForm.estatus as any) || b.estatus,
      } : b));
      setEditTarget(null);
      showToast(`Bodega "${editForm.nombre}" actualizada`);
    } catch (e: any) {
      setEditError(e.message || 'Error al guardar');
    } finally {
      setEditLoading(false);
    }
  }

  /* ─── APROBAR/RECHAZAR ─── */
  async function procesarAccion() {
    if (!modalAccion) return;
    setAccionLoading(true);
    try {
      const r = await fetch(`${BASE}/bodegas/${modalAccion.bodega.id}/${modalAccion.tipo}`, {
        method: 'PATCH', headers: HDR(),
      });
      if (!r.ok) throw new Error(`Error al ${modalAccion.tipo}`);
      const nuevoEstatus = modalAccion.tipo === 'aprobar' ? 'aprobada' : 'rechazada';
      setBodegas(prev => prev.map(b => b.id === modalAccion.bodega.id ? { ...b, estatus: nuevoEstatus as any } : b));
      showToast(`Bodega ${modalAccion.tipo === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`);
    } catch (e: any) { showToast(e.message, false); }
    finally { setModalAccion(null); setAccionLoading(false); }
  }

  const cntAprob   = bodegas.filter(b => b.estatus === 'aprobada').length;
  const cntPend    = bodegas.filter(b => b.estatus === 'pendiente').length;

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] gap-3 overflow-hidden">

      {/* ── Tab Bar ── */}
      <div className="bg-[#eef8f2] flex-shrink-0 rounded-b-2xl overflow-hidden border border-[#1A5C38]/30 border-t-0">
        <div className="flex items-center justify-between gap-1.5 px-2 py-1.5">
          <div className="flex items-center gap-1 flex-wrap">
            {([
              { key: 'bodegas',      label: 'Bodegas',       icon: <Table2 size={11} />,      badge: bodegas.length },
              { key: 'lista',        label: 'Lista + Mapa',  icon: <Navigation2 size={11} />, badge: null },
              { key: 'estadisticas', label: 'Estadísticas',  icon: <BarChart3 size={11} />,   badge: null },
              { key: 'pendientes',   label: 'Por aprobar',   icon: <ShieldAlert size={11} />, badge: cntPend },
            ] as const).map(({ key, label, icon, badge }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 ${
                  tab === key ? 'bg-[#1A5C38] text-white shadow-sm' : 'text-[#1A5C38] hover:bg-[#d4efe1]'
                }`}>
                {icon}{label}
                {badge !== null && badge > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    tab === key ? 'bg-white/20 text-white' : 'bg-[#1A5C38]/10 text-[#1A5C38]'
                  }`}>{badge}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={cargarBodegas} disabled={loading}
            className="p-1.5 rounded-lg text-[#1A5C38] bg-[#d4efe1] hover:bg-[#1A5C38] hover:text-white border border-[#1A5C38]/20 hover:border-transparent transition disabled:opacity-50">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          TAB: BODEGAS (tabla)
      ═══════════════════════════════════════ */}
      {tab === 'bodegas' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">

          {/* Cabecera stats */}
          <div className="px-4 py-2.5 border-b border-gray-50 flex-shrink-0 flex items-center gap-4 bg-[#eef8f2]/40">
            {[
              { label: 'Total',      val: bodegas.length,  dot: 'bg-[#1A5C38]',    color: 'text-[#1A5C38]' },
              { label: 'Aprobadas',  val: cntAprob,        dot: 'bg-emerald-500',  color: 'text-emerald-700' },
              { label: 'Pendientes', val: cntPend,         dot: 'bg-amber-400',    color: 'text-amber-700' },
              { label: 'Rechazadas', val: bodegas.filter(b=>b.estatus==='rechazada').length, dot:'bg-red-400', color:'text-red-600'},
            ].map(({ label, val, dot, color }, i) => (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <div className="w-px h-3 bg-[#1A5C38]/15" />}
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  <span className={`text-[12px] font-black ${color}`}>{loading ? '—' : val}</span>
                  <span className="text-[9.5px] text-[#1A5C38]/50 font-medium">{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Buscar bodega o silo..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 text-[11px] outline-none focus:border-[#1A5C38]/40 focus:bg-white transition" />
            </div>
            <select value={estatusFilter} onChange={e => setEstatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-700 outline-none focus:border-[#1A5C38]/40 cursor-pointer transition">
              <option value="">Estatus (todos)</option>
              <option value="aprobada">Aprobada</option>
              <option value="pendiente">Pendiente</option>
              <option value="rechazada">Rechazada</option>
            </select>
            <span className="text-[10.5px] text-gray-400 font-medium ml-auto">{filteredList.length} resultados</span>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center gap-2">
              <RefreshCw size={18} className="text-[#1A5C38] animate-spin" />
              <p className="text-[12px] text-gray-400">Cargando bodegas...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <ShieldAlert size={28} className="text-gray-300" />
              <p className="text-[13px] font-bold text-gray-500">Sin resultados</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse" style={{ fontSize: '11.5px' }}>
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/90 border-b border-gray-100">
                    {['#','Bodega','Ubicación','Capacidad','Estatus','Semáforo','Acciones'].map(h => (
                      <th key={h} className="py-2 px-3 text-[9.5px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap first:pl-4 last:pr-4 last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredList.map((b, idx) => {
                    const ecfg = ESTATUS_CFG[b.estatus] || ESTATUS_CFG.rechazada;
                    const scfg = SEM_CFG[b.semaforo_compra] || SEM_CFG.sin_actividad;
                    return (
                      <tr key={b.id} className="hover:bg-[#f9fdfb] transition-colors">
                        <td className="py-2 pl-4 pr-2 text-[10px] text-gray-300 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <p className="font-bold text-gray-800 leading-tight whitespace-nowrap">{b.nombre}</p>
                          {b.encargado_nombre && <p className="text-[10px] text-gray-400 mt-0.5">{b.encargado_nombre}</p>}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <p className="font-semibold text-gray-700 text-[11px]">{b.municipio || '—'}</p>
                          <p className="text-[10px] text-gray-400">{b.estado || ''}</p>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-semibold text-gray-700">
                          {b.capacidad_total > 0 ? `${b.capacidad_total.toLocaleString()} t` : '—'}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${ecfg.color}`}>{ecfg.label}</span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${scfg.dot}`} />
                            <span className="text-[10px] text-gray-500">{scfg.label}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 pr-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => abrirDetalle(b)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A5C38] hover:bg-[#eef8f2] transition" title="Ver detalle">
                              <Eye size={12} />
                            </button>
                            <button onClick={() => abrirEditar(b)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Editar">
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
          TAB: LISTA + MAPA (Mapbox)
      ═══════════════════════════════════════ */}
      <div style={{ display: tab === 'lista' ? 'flex' : 'none' }}
        className="flex-col flex-1 gap-3 overflow-hidden min-h-0">

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-3 flex-shrink-0">
          {[
            { icon: <Warehouse size={14}/>, color: 'bg-gray-100 text-gray-600', val: bodegas.length, label: 'Total' },
            { icon: <CheckCircle size={14}/>, color: 'bg-emerald-50 text-emerald-700', val: cntAprob, label: 'Aprobadas' },
            { icon: <ShieldAlert size={14}/>, color: 'bg-amber-50 text-amber-700', val: cntPend, label: 'Pendientes' },
          ].map(({ icon, color, val, label }) => (
            <div key={label} className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
              <div><p className="text-[16px] font-black text-gray-900 leading-none">{val}</p>
                <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row flex-1 gap-3 overflow-hidden min-h-0">
          {/* Lista */}
          <div className="w-full lg:w-[360px] flex flex-col bg-white border border-gray-100 shadow-sm rounded-2xl flex-shrink-0 overflow-hidden">
            <div className="p-3 space-y-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Buscar bodega..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-7 pr-3 py-2 text-[11.5px] outline-none focus:border-[#1A5C38]/40 focus:bg-white transition" />
                </div>
                <span className="text-[10px] font-bold text-[#1A5C38] bg-[#eef8f2] border border-[#1A5C38]/20 px-2 py-1 rounded-lg">{filteredList.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-[11px] text-gray-700 outline-none focus:border-[#1A5C38]/40 transition">
                  <option value="">Estados</option>
                  {[...new Set(bodegas.map(b => b.estado).filter(Boolean))].sort().map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <select value={estatusFilter} onChange={e => setEstatusFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-[11px] text-gray-700 outline-none focus:border-[#1A5C38]/40 transition">
                  <option value="">Estatus</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-2">
                  <RefreshCw size={16} className="text-[#1A5C38] animate-spin" />
                  <p className="text-[11.5px] text-gray-400">Cargando...</p>
                </div>
              ) : filteredList.map(b => (
                <div key={b.id} onClick={() => focusBodega(b)}
                  className={`px-3 py-3 cursor-pointer transition-all flex items-start gap-3 ${
                    selectedId === b.id ? 'bg-emerald-50/60 border-l-2 border-l-[#1A5C38]' : 'hover:bg-gray-50/70'
                  }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    b.estatus === 'aprobada' ? 'bg-emerald-100 text-emerald-700' :
                    b.estatus === 'pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                  }`}><Warehouse size={13} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[11.5px] font-bold text-gray-900 leading-snug line-clamp-2">{b.nombre}</p>
                      <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${ESTATUS_CFG[b.estatus]?.color}`}>
                        {ESTATUS_CFG[b.estatus]?.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-2">
                      <MapPin size={8} /> {b.municipio}, {b.estado}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${SEM_CFG[b.semaforo_compra]?.dot || 'bg-gray-300'}`} />
                        <span className="text-[10px] text-gray-500">{b.capacidad_total.toLocaleString()} t</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); navigate(`/admin/bodegas/${b.id}`); }}
                        className="text-[9.5px] font-bold text-[#1A5C38] bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 transition">
                        Ver <Eye size={8} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa Mapbox */}
          <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden relative">
            <div ref={mapContainer} className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          TAB: ESTADÍSTICAS
      ═══════════════════════════════════════ */}
      {tab === 'estadisticas' && (
        <div className="flex-1 overflow-y-auto">
          {statsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw size={24} className="text-emerald-500 animate-spin" />
              <p className="text-[13px] text-gray-500">Cargando estadísticas...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wide">Ocupación de almacenamiento</p>
                    <p className="text-[36px] font-black text-gray-900 leading-none mt-1.5">
                      {stats.pct_ocupacion || 0}<span className="text-[16px] text-gray-400 ml-0.5">%</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Percent size={20} /></div>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Number(stats.pct_ocupacion) || 0)}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100 mt-1">
                  <div className="flex items-center gap-2.5 pt-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center"><Weight size={15} /></div>
                    <div><p className="text-[16px] font-black text-gray-900 leading-none">{Number(stats.capacidad_total || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Capacidad total (t)</p></div>
                  </div>
                  <div className="flex items-center gap-2.5 pt-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center"><Package size={15} /></div>
                    <div><p className="text-[16px] font-black text-gray-900 leading-none">{Number(stats.stock_total || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Stock actual (t)</p></div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><FileText size={17} /></div>
                  <div><p className="text-[22px] font-black text-gray-900 leading-none">{stats.con_tarifario || 0}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">Con Tarifario</p></div>
                </div>
                <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center"><LayoutGrid size={17} /></div>
                  <div><p className="text-[22px] font-black text-gray-900 leading-none">{stats.ventanillas_activas || 0}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">Ventanillas Activas</p></div>
                </div>
              </div>
            </div>
          ) : <div className="text-center py-16 text-gray-500 text-[13px]">No se pudieron cargar las estadísticas.</div>}
        </div>
      )}

      {/* ═══════════════════════════════════════
          TAB: PENDIENTES
      ═══════════════════════════════════════ */}
      {tab === 'pendientes' && (
        <div className="flex-1 overflow-y-auto">
          {bodegas.filter(b => b.estatus === 'pendiente').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <ShieldAlert size={40} className="mb-3 opacity-40" />
              <p className="text-[13px] font-semibold">No hay bodegas pendientes de aprobación</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bodegas.filter(b => b.estatus === 'pendiente').map(b => (
                <div key={b.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                        <Warehouse size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-[13px] leading-tight line-clamp-2">{b.nombre}</h3>
                        <p className="text-gray-400 text-[10.5px] flex items-center gap-1 mt-0.5">
                          <MapPin size={9} /> {b.municipio}, {b.estado}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Capacidad</p>
                        <p className="text-[14px] font-black text-gray-900">{b.capacidad_total.toLocaleString()} t</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2.5">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Encargado</p>
                        <p className="text-[11px] font-semibold text-gray-700 line-clamp-1">{b.encargado_nombre || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => setModalAccion({ tipo: 'aprobar', bodega: b })}
                      className="flex-1 bg-[#1A5C38] hover:bg-[#15482d] text-white font-bold py-2 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5">
                      <CheckCircle size={13} /> Aprobar
                    </button>
                    <button onClick={() => setModalAccion({ tipo: 'rechazar', bodega: b })}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold py-2 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5">
                      <X size={13} /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL: DETALLE COMPLETO
      ═══════════════════════════════════════ */}
      {detalleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: 'fadeInBackdrop .2s ease' }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[6px]"
            onClick={() => setDetalleTarget(null)} />
          <div className="relative bg-white/96 backdrop-blur-xl w-full max-w-[520px] max-h-[88vh] rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.26)] overflow-hidden flex flex-col"
            style={{ animation: 'slideUpSheet .26s cubic-bezier(0.34,1.28,0.64,1)' }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 ${
                  detalleTarget.estatus === 'aprobada' ? 'bg-emerald-100 text-emerald-700' :
                  detalleTarget.estatus === 'pendiente' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                }`}><Warehouse size={20} /></div>
                <div>
                  <h2 className="text-[17px] font-bold text-gray-900 leading-tight">{detalleTarget.nombre}</h2>
                  <p className="text-[11.5px] text-gray-500 mt-0.5">{detalleTarget.municipio}, {detalleTarget.estado}</p>
                </div>
              </div>
              <button onClick={() => setDetalleTarget(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition flex-shrink-0">
                <X size={14} className="text-gray-500" />
              </button>
            </div>

            {/* Cuerpo scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {detalleLoading ? (
                <div className="flex items-center justify-center py-12 gap-2">
                  <Loader2 size={20} className="text-[#1A5C38] animate-spin" />
                  <p className="text-[12px] text-gray-400">Cargando datos completos...</p>
                </div>
              ) : (() => {
                const d = detalleData || detalleTarget;
                const rows = [
                  { icon: <Building2 size={12}/>, label:'Clave/ID',      val: d.clave || `#${d.id}` },
                  { icon: <Phone size={12}/>,     label:'Teléfono',       val: d.telefono || d.phone || '—' },
                  { icon: <Weight size={12}/>,    label:'Capacidad',      val: d.capacidad_ton ? `${Number(d.capacidad_ton).toLocaleString()} ton` : d.capacidad_total ? `${Number(d.capacidad_total).toLocaleString()} ton` : '—' },
                  { icon: <Package size={12}/>,   label:'Stock actual',   val: d.stock_actual != null ? `${Number(d.stock_actual).toLocaleString()} ton` : '—' },
                  { icon: <MapPin size={12}/>,    label:'Dirección',      val: [d.direccion, d.localidad, d.municipio, d.estado].filter(Boolean).join(', ') || '—' },
                  { icon: <Navigation2 size={12}/>,label:'Coordenadas',   val: `${d.latitud?.toFixed(5) || '—'}, ${d.longitud?.toFixed(5) || '—'}` },
                  { icon: <FileText size={12}/>,  label:'Región',         val: d.region_nombre || '—' },
                  { icon: <Calendar size={12}/>,  label:'Registro',       val: fmtDate(d.created_at || d.fecha_creacion) },
                ];
                return (
                  <>
                    {/* Status badges */}
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${(ESTATUS_CFG as any)[d.estatus]?.color || ''}`}>
                        {(ESTATUS_CFG as any)[d.estatus]?.label || d.estatus}
                      </span>
                      <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                        <div className={`w-2 h-2 rounded-full ${(SEM_CFG as any)[d.semaforo_compra]?.dot || 'bg-gray-300'}`} />
                        <span className="text-[11px] text-gray-600 font-semibold">{(SEM_CFG as any)[d.semaforo_compra]?.label || 'Sin actividad'}</span>
                      </div>
                    </div>

                    {/* Grid de datos */}
                    <div className="grid grid-cols-1 gap-0 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                      {rows.map(({ icon, label, val }, i) => (
                        <div key={label} className={`flex items-center gap-3 px-4 py-3 ${i < rows.length-1 ? 'border-b border-gray-100' : ''}`}>
                          <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400">{icon}</div>
                          <span className="text-[11px] text-gray-500 w-24 flex-shrink-0">{label}</span>
                          <span className="text-[12px] font-semibold text-gray-800 flex-1">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Encargado */}
                    {d.encargado_nombre && (
                      <div className="bg-[#eef8f2] border border-[#1A5C38]/15 rounded-2xl px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A5C38] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0">
                          {d.encargado_nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-gray-900">{d.encargado_nombre}</p>
                          <p className="text-[10.5px] text-gray-500">Encargado de bodega</p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex-shrink-0 flex gap-2.5">
              <button onClick={() => { setDetalleTarget(null); navigate(`/admin/bodegas/${detalleTarget.id}`); }}
                className="flex-1 py-3 rounded-[14px] text-[14px] font-semibold text-white transition active:scale-[.98]"
                style={{ background: 'linear-gradient(135deg,#1A5C38,#15482d)', boxShadow:'0 4px 14px rgba(26,92,56,.3)' }}>
                Abrir ficha completa →
              </button>
              <button onClick={() => { setDetalleTarget(null); abrirEditar(detalleTarget); }}
                className="px-4 py-3 rounded-[14px] text-[14px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition active:scale-[.98] flex items-center gap-1.5">
                <Edit3 size={14} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL: EDITAR BODEGA — Apple 2026
      ═══════════════════════════════════════ */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ animation: 'fadeInBackdrop .2s ease' }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[6px]"
            onClick={() => { if (!editLoading) setEditTarget(null); }} />
          <div className="relative bg-white/96 backdrop-blur-xl w-full max-w-[480px] rounded-[28px] shadow-[0_32px_80px_rgba(0,0,0,0.26)] overflow-hidden"
            style={{ animation: 'slideUpSheet .26s cubic-bezier(0.34,1.28,0.64,1)' }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[13px] bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900">Editar bodega</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[240px]">{editTarget.nombre}</p>
                </div>
              </div>
              <button onClick={() => setEditTarget(null)} disabled={editLoading}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition disabled:opacity-40">
                <X size={14} className="text-gray-500" />
              </button>
            </div>

            {/* Formulario */}
            <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {[
                { key: 'nombre',    label: 'Nombre',    type: 'text',   placeholder: 'Nombre de la bodega' },
                { key: 'estado',    label: 'Estado',    type: 'text',   placeholder: 'Estado' },
                { key: 'municipio', label: 'Municipio', type: 'text',   placeholder: 'Municipio' },
                { key: 'localidad', label: 'Localidad', type: 'text',   placeholder: 'Localidad (opcional)' },
                { key: 'direccion', label: 'Dirección', type: 'text',   placeholder: 'Dirección (opcional)' },
                { key: 'telefono',  label: 'Teléfono',  type: 'text',   placeholder: 'Teléfono (opcional)' },
                { key: 'capacidad_total', label: 'Capacidad (ton)', type: 'number', placeholder: '0' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">{label}</label>
                  <input type={type} placeholder={placeholder}
                    value={(editForm as any)[key] ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, [key]: type === 'number' ? e.target.value : e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-800 outline-none focus:border-[#1A5C38]/50 focus:bg-white transition" />
                </div>
              ))}

              {/* Estatus */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Estatus</label>
                <select value={editForm.estatus || ''} onChange={e => setEditForm(f => ({ ...f, estatus: e.target.value as any }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-gray-800 outline-none focus:border-[#1A5C38]/50 transition cursor-pointer">
                  <option value="aprobada">Aprobada</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>

              {editError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  <X size={12} className="text-red-500 flex-shrink-0" />
                  <p className="text-[12px] text-red-600">{editError}</p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex gap-2.5">
              <button onClick={guardarEdicion} disabled={editLoading}
                className="flex-1 py-3.5 rounded-[16px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition active:scale-[.97] disabled:opacity-60"
                style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 4px 14px rgba(99,102,241,.35)' }}>
                {editLoading ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                             : <><Save size={15} /> Guardar cambios</>}
              </button>
              <button onClick={() => setEditTarget(null)} disabled={editLoading}
                className="px-5 py-3.5 rounded-[16px] text-[15px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition active:scale-[.97] disabled:opacity-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MODAL: APROBAR / RECHAZAR
      ═══════════════════════════════════════ */}
      {modalAccion && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4"
          style={{ animation: 'fadeInBackdrop .18s ease' }}>
          <div className="bg-white border border-gray-100 w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden"
            style={{ animation: 'slideUpSheet .22s cubic-bezier(0.34,1.28,0.64,1)' }}>
            <div className="p-6 pb-4 border-b border-gray-100 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                modalAccion.tipo === 'aprobar' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {modalAccion.tipo === 'aprobar' ? <CheckCircle size={24} /> : <X size={24} />}
              </div>
              <h3 className="text-gray-900 text-[18px] font-black tracking-tight">
                ¿{modalAccion.tipo === 'aprobar' ? 'Aprobar' : 'Rechazar'} bodega?
              </h3>
              <p className="text-gray-500 text-[13px] mt-1.5 leading-relaxed">
                <span className="text-gray-900 font-bold">{modalAccion.bodega.nombre}</span>
              </p>
            </div>
            <div className="p-4 flex gap-3">
              <button onClick={() => setModalAccion(null)} disabled={accionLoading}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition">
                Cancelar
              </button>
              <button onClick={procesarAccion} disabled={accionLoading}
                className={`flex-1 py-3 rounded-xl text-[13px] font-black text-white transition ${
                  modalAccion.tipo === 'aprobar' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500 hover:bg-red-400'
                }`}>
                {accionLoading ? 'Procesando...' : `Sí, ${modalAccion.tipo}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-[12.5px] font-semibold ${
          toast.ok ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
        }`} style={{ animation: 'slideUpFade .3s ease' }}>
          {toast.ok
            ? <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0"><CheckCircle size={11} className="text-gray-900" /></div>
            : <X size={14} className="text-white flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Animaciones */}
      <style>{`
        @keyframes fadeInBackdrop { from{opacity:0} to{opacity:1} }
        @keyframes slideUpSheet { from{opacity:0;transform:translateY(40px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes slideUpFade { from{opacity:0;transform:translate(-50%,16px)} to{opacity:1;transform:translate(-50%,0)} }
        .mapboxgl-popup-content { border-radius:16px!important; padding:14px!important; box-shadow:0 8px 32px rgba(0,0,0,.18)!important; border:1px solid rgba(0,0,0,.06)!important; }
        .mapboxgl-popup-close-button { font-size:18px; right:10px; top:8px; color:#9CA3AF; }
        .mapboxgl-popup-close-button:hover { color:#374151; background:none; }
      `}</style>
    </div>
  );
}
